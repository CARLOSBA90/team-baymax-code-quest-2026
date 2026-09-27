import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Route, Routes, useLocation, useNavigationType } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { deleteRoadmap, getRoadmap, setRoadmapPaused, trackItemCompletion } from "@/api/services";
import { RoadmapDetailPage } from "@/pages";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapItemNotFoundError,
  buildRoadmapPausedError,
  buildTrackingMismatchError,
  buildTrackProgressResult,
} from "@/test/fixtures/progress";
import {
  buildCompletedRoadmapDetail,
  buildPausedRoadmapDetail,
  buildRoadmapDetail,
  ROADMAP_DETAIL,
} from "@/test/fixtures/roadmap-detail";
import {
  buildInvalidRoadmapTransitionError,
  buildRoadmapNotFoundError,
  buildRoadmapVersionConflictError,
  PAUSED_AT,
} from "@/test/fixtures/roadmap-pause";
import { createTestQueryClient, renderWithProviders } from "@/test/renderWithProviders";
import { byTextContent } from "@/test/textContent";
import type { RoadmapDetail } from "@/types";

vi.mock("@/api/services", () => ({
  deleteRoadmap: vi.fn(),
  getRoadmap: vi.fn(),
  setRoadmapPaused: vi.fn(),
  trackItemCompletion: vi.fn(),
}));

const ID = ROADMAP_DETAIL.id;

function renderPage(
  route = `/dashboard/roadmaps/${ID}`,
  options: Parameters<typeof renderWithProviders>[1] = {},
) {
  return renderWithProviders(
    <Routes>
      <Route path="/dashboard/roadmaps" element={<h1>Mis Rutas</h1>} />
      <Route
        path="/dashboard/roadmaps/:roadmapId"
        element={
          <>
            <Link to="/dashboard/roadmaps/r2">Ir a r2</Link>
            <RoadmapDetailPage />
          </>
        }
      />
    </Routes>,
    { route, ...options },
  );
}

function roadmapHeading(name = ROADMAP_DETAIL.name) {
  return screen.findByRole("heading", { level: 1, name });
}

describe("RoadmapDetailPage", () => {
  beforeEach(() => {
    vi.mocked(getRoadmap).mockResolvedValue(ROADMAP_DETAIL);
  });

  it("mientras carga muestra el skeleton accesible y ningún h1", () => {
    vi.mocked(getRoadmap).mockReturnValue(new Promise<RoadmapDetail>(() => {}));
    renderPage();

    const region = screen.getByRole("region", { name: "Detalle de la ruta" });
    expect(region.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando la ruta");
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("con datos muestra nombre, resumen, estado, contador de pasos y lista", async () => {
    renderPage();

    expect(await roadmapHeading()).toBeInTheDocument();
    expect(getRoadmap).toHaveBeenCalledWith(ID);
    expect(screen.getByText(ROADMAP_DETAIL.summary)).toBeInTheDocument();
    expect(screen.getByText("Empezada")).toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: ROADMAP_DETAIL.name })).toHaveAttribute(
      "aria-valuenow",
      "33",
    );
    expect(
      screen.getByText(byTextContent("1 de 4 pasos · 7 h en total · quedan ~5 h")),
    ).toBeInTheDocument();
    expect(screen.getByRole("list", { name: "Pasos de la ruta" })).toBeInTheDocument();
    expect(screen.queryByRole("status")).not.toBeInTheDocument();
  });

  it("con 404 muestra «No encontramos esta ruta» sin reintentar y el CTA vuelve a Mis Rutas", async () => {
    vi.mocked(getRoadmap).mockRejectedValue(buildAxiosError(404, "Roadmap not found"));
    renderPage("/dashboard/roadmaps/nope");

    expect(
      await screen.findByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
    expect(screen.queryByText("Roadmap not found")).not.toBeInTheDocument();
    expect(getRoadmap).toHaveBeenCalledTimes(1);

    await userEvent.setup().click(screen.getByRole("link", { name: "Volver a Mis Rutas" }));

    expect(await screen.findByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
  });

  it("con 500 muestra el error en español y «Reintentar» vuelve a pedir sin recargar", async () => {
    const reload = vi.fn();
    vi.stubGlobal("location", { ...window.location, reload });
    vi.mocked(getRoadmap).mockRejectedValueOnce(buildAxiosError(500, "Internal server error"));
    renderPage();

    expect(
      await screen.findByRole("heading", { level: 1, name: "No pudimos cargar la ruta" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
    expect(screen.queryByText("No encontramos esta ruta")).not.toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("button", { name: "Reintentar" }));

    expect(await roadmapHeading()).toBeInTheDocument();
    expect(getRoadmap).toHaveBeenCalledTimes(2);
    expect(reload).not.toHaveBeenCalled();
  });

  it("con error de red muestra el error de carga, no el de ruta no encontrada", async () => {
    vi.mocked(getRoadmap).mockRejectedValue(buildNetworkError());
    renderPage();

    expect(await screen.findByRole("alert")).toHaveTextContent("No pudimos cargar la ruta");
    expect(screen.queryByText("No encontramos esta ruta")).not.toBeInTheDocument();
  });

  it("si falla una revalidación con datos en caché sigue mostrando los datos", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(roadmapsKeys.detail(ID), ROADMAP_DETAIL);
    vi.mocked(getRoadmap).mockRejectedValue(buildAxiosError(500, "Internal server error"));
    renderPage(undefined, { queryClient });
    expect(await roadmapHeading()).toBeInTheDocument();

    await queryClient.invalidateQueries({ queryKey: roadmapsKeys.all });

    await waitFor(() => expect(getRoadmap).toHaveBeenCalled());
    await waitFor(() =>
      expect(queryClient.getQueryState(roadmapsKeys.detail(ID))?.status).toBe("error"),
    );
    expect(
      screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("si la revalidación responde 404 con datos en caché pasa a «No encontramos esta ruta»", async () => {
    const queryClient = createTestQueryClient();
    queryClient.setQueryData(roadmapsKeys.detail(ID), ROADMAP_DETAIL);
    vi.mocked(getRoadmap).mockRejectedValue(buildAxiosError(404));
    renderPage(undefined, { queryClient });
    expect(await roadmapHeading()).toBeInTheDocument();

    await queryClient.invalidateQueries({ queryKey: roadmapsKeys.all });

    expect(
      await screen.findByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).toBeInTheDocument();
    expect(screen.queryByText(ROADMAP_DETAIL.name)).not.toBeInTheDocument();
  });

  it("no muestra el `reason` aunque llegue en los datos", async () => {
    const withReason = {
      ...buildRoadmapDetail(),
      reason: "Recommended because…",
    } as RoadmapDetail;
    vi.mocked(getRoadmap).mockResolvedValue(withReason);
    renderPage();

    expect(await roadmapHeading()).toBeInTheDocument();
    expect(screen.queryByText(/Recommended because/)).not.toBeInTheDocument();
  });

  it("al navegar de r1 a r2 pide r2 y nunca muestra el nombre de r1 bajo r2", async () => {
    const r1 = buildRoadmapDetail({ id: "r1", name: "Ruta uno" });
    const r2 = buildRoadmapDetail({ id: "r2", name: "Ruta dos" });
    let resolveR2: (value: RoadmapDetail) => void = () => {};
    vi.mocked(getRoadmap).mockImplementation((id) =>
      id === "r1"
        ? Promise.resolve(r1)
        : new Promise<RoadmapDetail>((resolve) => {
            resolveR2 = resolve;
          }),
    );
    renderPage("/dashboard/roadmaps/r1");
    expect(await roadmapHeading("Ruta uno")).toBeInTheDocument();

    await userEvent.setup().click(screen.getByRole("link", { name: "Ir a r2" }));

    await waitFor(() => expect(getRoadmap).toHaveBeenCalledWith("r2"));
    expect(screen.queryByText("Ruta uno")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Cargando la ruta");

    resolveR2(r2);

    expect(await roadmapHeading("Ruta dos")).toBeInTheDocument();
    expect(screen.queryByText("Ruta uno")).not.toBeInTheDocument();
  });
});

describe("RoadmapDetailPage — «Marcar como completado» (refetch real)", () => {
  const ITEM_NAME = "Guía de hooks de React";
  const DIALOG_NAME = "¿Marcar este paso como completado?";
  const COMPLETE_NAME = `Marcar como completado ${ITEM_NAME}`;

  /** `ROADMAP_DETAIL` con item-3 (READING, rastreable) como siguiente paso. */
  function buildFlowRoadmap(overrides: Partial<RoadmapDetail> = {}): RoadmapDetail {
    return buildRoadmapDetail({
      nextStep: {
        roadmapItemId: "item-3",
        name: ITEM_NAME,
        url: "https://react.dev/reference/react/hooks",
        lesson: null,
      },
      ...overrides,
    });
  }

  /** Lo que devuelve el back tras completar item-3: 2 de 4, 60 %, siguiente = item-2. */
  function buildRefreshedRoadmap(): RoadmapDetail {
    const base = buildFlowRoadmap();
    return {
      ...base,
      progress: 60,
      lastActivity: "2026-09-25T11:00:00.000Z",
      activityVersion: 13,
      items: base.items.map((item) =>
        item.roadmapItemId === "item-3"
          ? {
              ...item,
              progress: 100,
              startedAt: "2026-09-25T11:00:00.000Z",
              completedAt: "2026-09-25T11:00:00.000Z",
            }
          : item,
      ),
      nextStep: ROADMAP_DETAIL.nextStep,
    };
  }

  function deferred<T>() {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  function timeline() {
    return screen.getByRole("list", { name: "Pasos de la ruta" });
  }

  function itemRow(name = ITEM_NAME) {
    const heading = within(timeline()).getByRole("heading", {
      level: 3,
      name: new RegExp(`: ${name}$`),
    });
    const row = heading.closest("li");
    if (!row) throw new Error("li no encontrado");
    return { heading, row };
  }

  function announcer() {
    return screen.getByTestId("roadmap-detail-announcer");
  }

  async function openAndConfirm(user: ReturnType<typeof userEvent.setup>) {
    await user.click(within(timeline()).getByRole("button", { name: COMPLETE_NAME }));
    await user.click(
      within(screen.getByRole("dialog", { name: DIALOG_NAME })).getByRole("button", {
        name: "Sí, completar",
      }),
    );
  }

  async function renderLoaded(options: Parameters<typeof renderWithProviders>[1] = {}) {
    const user = userEvent.setup();
    const result = renderPage(undefined, options);
    expect(await roadmapHeading()).toBeInTheDocument();
    return { user, ...result };
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove("overflow-hidden");
  });

  it("200: «Completando…» hasta que llega el detalle nuevo; luego chip, barra, anuncio y foco en el h3", async () => {
    const refetch = deferred<RoadmapDetail>();
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockReturnValueOnce(refetch.promise);
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    await waitFor(() => expect(getRoadmap).toHaveBeenCalledTimes(2));
    const dialog = screen.getByRole("dialog", { name: DIALOG_NAME });
    expect(within(dialog).getByText("Completando…")).toBeInTheDocument();
    expect(vi.mocked(trackItemCompletion).mock.calls[0][0]).toBe("item-3");

    refetch.resolve(buildRefreshedRoadmap());

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const { heading, row } = itemRow();
    expect(within(row).getByText("Completado")).toBeInTheDocument();
    expect(within(row).queryByRole("button", { name: COMPLETE_NAME })).not.toBeInTheDocument();
    expect(screen.getByRole("progressbar", { name: ROADMAP_DETAIL.name })).toHaveAttribute(
      "aria-valuenow",
      "60",
    );
    expect(announcer()).toHaveTextContent(
      `${ITEM_NAME} marcado como completado. Progreso de la ruta: 60 por ciento, 2 de 4 pasos.`,
    );
    expect(document.activeElement).toBe(heading);
    expect(heading).toHaveAccessibleName(`Paso 3 de 4: ${ITEM_NAME}`);
    expect(getRoadmap).toHaveBeenNthCalledWith(1, ID);
    expect(getRoadmap).toHaveBeenNthCalledWith(2, ID);
  });

  it("completar el último paso: aparece «Completaste la ruta» y el foco va a su h2", async () => {
    const completed = buildCompletedRoadmapDetail();
    const lastPending: RoadmapDetail = {
      ...completed,
      status: "IN_PROGRESS",
      progress: 75,
      items: completed.items.map((item) =>
        item.roadmapItemId === "item-3" ? { ...item, progress: 0, completedAt: null } : item,
      ),
      nextStep: { roadmapItemId: "item-3", name: ITEM_NAME, url: null, lesson: null },
    };
    vi.mocked(getRoadmap).mockResolvedValueOnce(lastPending).mockResolvedValueOnce(completed);
    vi.mocked(trackItemCompletion).mockResolvedValue(
      buildTrackProgressResult({
        roadmap: {
          id: ID,
          progress: 100,
          status: "COMPLETED",
          lastActivity: "2026-09-25T11:00:00.000Z",
          activityVersion: 13,
        },
      }),
    );
    const { user } = await renderLoaded();
    const liveRegion = announcer();

    await openAndConfirm(user);

    const region = await screen.findByRole("region", { name: "Completaste la ruta" });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(region).getByRole("heading", { level: 2, name: "Completaste la ruta" }),
      ),
    );
    // La live region es el mismo nodo antes y después del cambio a COMPLETED (no se remonta).
    expect(announcer()).toBe(liveRegion);
    expect(liveRegion).toHaveAttribute("aria-live", "polite");
    expect(announcer()).toHaveTextContent(
      `${ITEM_NAME} marcado como completado. Progreso de la ruta: 100 por ciento, 4 de 4 pasos. Completaste la ruta.`,
    );
  });

  it("409 pausada: el detalle recargado muestra el banner, se anuncia y el foco va a su h2", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockResolvedValueOnce(
        buildFlowRoadmap({ status: "PAUSED", pausedAt: "2026-09-25T10:00:00.000Z" }),
      );
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapPausedError());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    const region = await screen.findByRole("region", { name: "Esta ruta está en pausa" });
    await waitFor(() =>
      expect(document.activeElement).toBe(within(region).getByRole("heading", { level: 2 })),
    );
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(announcer()).toHaveTextContent(
      "Esta ruta está pausada. Reanúdala para registrar tu avance.",
    );
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(getRoadmap).toHaveBeenCalledTimes(2);
  });

  it("409 pausada con el refetch fallido: cierra el diálogo, la vista sigue montada y el foco va al h1", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockRejectedValueOnce(buildNetworkError());
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapPausedError());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const heading = screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name });
    await waitFor(() => expect(document.activeElement).toBe(heading));
    expect(
      screen.queryByRole("region", { name: "Esta ruta está en pausa" }),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("No pudimos cargar la ruta")).not.toBeInTheDocument();
    expect(getRoadmap).toHaveBeenCalledTimes(2);
  });

  it("422: el paso recargado muestra su mensaje de seguimiento y el foco va a su h3", async () => {
    const refreshed = buildFlowRoadmap();
    // CHALLENGE sigue sin poder marcarse a mano; LESSONS ya no sirve de ejemplo desde que el
    // atajo bulk lo hace completable.
    refreshed.items[2] = {
      ...refreshed.items[2],
      tracking: { type: "CHALLENGE", enabled: true, disabledReason: null },
    };
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockResolvedValueOnce(refreshed);
    vi.mocked(trackItemCompletion).mockRejectedValue(buildTrackingMismatchError());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const { heading, row } = itemRow();
    await waitFor(() =>
      expect(within(row).getByText("El avance se registra al enviar el reto.")).toBeInTheDocument(),
    );
    expect(within(row).queryByRole("button", { name: COMPLETE_NAME })).not.toBeInTheDocument();
    expect(document.activeElement).toBe(heading);
    expect(announcer()).toHaveTextContent(
      "Este paso ya no se puede marcar como completado desde aquí.",
    );
  });

  it("404 con la ruta viva: aviso, el paso desaparece y el foco va al h1", async () => {
    const withoutItem = buildRoadmapDetail({
      items: ROADMAP_DETAIL.items.filter((item) => item.roadmapItemId !== "item-3"),
    });
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockResolvedValueOnce(withoutItem);
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapItemNotFoundError());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    const notice = await screen.findByText("Este paso ya no existe. Hemos actualizado la ruta.");
    expect(notice).toHaveAttribute("role", "status");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(within(timeline()).queryByText(ITEM_NAME)).not.toBeInTheDocument();
    expect(within(timeline()).getAllByRole("listitem")).toHaveLength(3);
    expect(document.activeElement).toBe(
      screen.getByRole("heading", { level: 1, name: ROADMAP_DETAIL.name }),
    );
    expect(announcer()).toBeEmptyDOMElement();
  });

  it("404 con la ruta borrada: «No encontramos esta ruta», sin diálogo ni bloqueo de scroll", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockRejectedValueOnce(buildAxiosError(404, "Roadmap not found"));
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapItemNotFoundError());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    expect(
      await screen.findByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).toBeInTheDocument();
    expect(document.querySelector("dialog")).toBeNull();
    expect(document.documentElement).not.toHaveClass("overflow-hidden");
    expect(screen.queryByText("Roadmap not found")).not.toBeInTheDocument();
  });

  it("200 con el refetch fallido: cierra, parchea el paso y no muestra el error de carga", async () => {
    vi.mocked(getRoadmap)
      .mockResolvedValueOnce(buildFlowRoadmap())
      .mockRejectedValueOnce(buildAxiosError(500, "Internal server error"));
    vi.mocked(trackItemCompletion).mockResolvedValue(buildTrackProgressResult());
    const { user } = await renderLoaded();

    await openAndConfirm(user);

    await waitFor(() => expect(screen.queryByRole("dialog")).not.toBeInTheDocument());
    const { heading, row } = itemRow();
    expect(within(row).queryByRole("button", { name: COMPLETE_NAME })).not.toBeInTheDocument();
    expect(within(row).getByText("Completado")).toBeInTheDocument();
    expect(screen.queryByText("No pudimos cargar la ruta")).not.toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(heading);
    expect(announcer()).toHaveTextContent(
      `${ITEM_NAME} marcado como completado. Progreso de la ruta: 60 por ciento, 2 de 4 pasos.`,
    );
  });

  it("al cambiar de :roadmapId (con r2 en caché) el aviso y el anuncio no sobreviven", async () => {
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
    });
    const r2 = buildRoadmapDetail({ id: "r2", name: "Ruta dos" });
    queryClient.setQueryData(roadmapsKeys.detail("r2"), r2);
    const withoutItem = buildRoadmapDetail({
      items: ROADMAP_DETAIL.items.filter((item) => item.roadmapItemId !== "item-3"),
    });
    let r1Calls = 0;
    vi.mocked(getRoadmap).mockImplementation((id) => {
      if (id === "r2") return Promise.resolve(r2);
      r1Calls += 1;
      return Promise.resolve(r1Calls === 1 ? buildFlowRoadmap() : withoutItem);
    });
    vi.mocked(trackItemCompletion).mockRejectedValue(buildRoadmapItemNotFoundError());
    const { user } = await renderLoaded({ queryClient });

    await openAndConfirm(user);
    expect(
      await screen.findByText("Este paso ya no existe. Hemos actualizado la ruta."),
    ).toBeInTheDocument();

    await user.click(screen.getByRole("link", { name: "Ir a r2" }));

    expect(await roadmapHeading("Ruta dos")).toBeInTheDocument();
    expect(
      screen.queryByText("Este paso ya no existe. Hemos actualizado la ruta."),
    ).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
  });

  it("Cancelar no llama al servicio ni recarga el detalle", async () => {
    vi.mocked(getRoadmap).mockResolvedValue(buildFlowRoadmap());
    const { user } = await renderLoaded();

    await user.click(within(timeline()).getByRole("button", { name: COMPLETE_NAME }));
    await user.click(
      within(screen.getByRole("dialog", { name: DIALOG_NAME })).getByRole("button", {
        name: "Cancelar",
      }),
    );

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trackItemCompletion).not.toHaveBeenCalled();
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });
});

describe("RoadmapDetailPage — pausar, reanudar y eliminar (refetch real)", () => {
  const NAME = ROADMAP_DETAIL.name;
  const TRIGGER_NAME = `Más acciones para ${NAME}`;
  const PAUSED_ANNOUNCEMENT = "Ruta pausada. Mientras esté pausada no se registra tu avance.";
  const RESUMED_ANNOUNCEMENT = "Ruta reanudada. Ya puedes registrar tu avance.";
  const UPDATED_ELSEWHERE =
    "Alguien actualizó esta ruta desde otro lugar. Ya tienes la versión más reciente.";
  const NETWORK_MESSAGE =
    "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";
  const PAUSE_GENERIC_MESSAGE = "No se pudo pausar la ruta. Inténtalo de nuevo.";
  const RESUME_GENERIC_MESSAGE = "No se pudo reanudar la ruta. Inténtalo de nuevo.";

  /** Respuesta 200 de pausar `ROADMAP_DETAIL` (v12 → v13). */
  function buildPausedResponse(): RoadmapDetail {
    return buildRoadmapDetail({ status: "PAUSED", pausedAt: PAUSED_AT, activityVersion: 13 });
  }

  /** Respuesta 200 de reanudar `buildPausedRoadmapDetail()` (v12 → v13). */
  function buildResumedResponse(): RoadmapDetail {
    return buildRoadmapDetail({ status: "IN_PROGRESS", pausedAt: null, activityVersion: 13 });
  }

  function deferred<T>() {
    let resolve: (value: T) => void = () => {};
    const promise = new Promise<T>((r) => {
      resolve = r;
    });
    return { promise, resolve };
  }

  function trigger() {
    return screen.getByRole("button", { name: TRIGGER_NAME });
  }

  function mainHeading() {
    return screen.getByRole("heading", { level: 1, name: NAME });
  }

  function announcer() {
    return screen.getByTestId("roadmap-detail-announcer");
  }

  function pausedRegion() {
    return screen.getByRole("region", { name: "Esta ruta está en pausa" });
  }

  function completeButtons() {
    return screen.getAllByRole("button", { name: /^Marcar como completado/ });
  }

  async function renderLoaded(initial: RoadmapDetail = ROADMAP_DETAIL) {
    vi.mocked(getRoadmap).mockResolvedValueOnce(initial);
    const user = userEvent.setup();
    const result = renderPage();
    expect(await roadmapHeading()).toBeInTheDocument();
    return { user, ...result };
  }

  async function selectMenuItem(user: ReturnType<typeof userEvent.setup>, label: string) {
    await user.click(trigger());
    await user.click(screen.getByRole("menuitem", { name: label }));
  }

  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
    document.documentElement.classList.remove("overflow-hidden");
  });

  it("pausar desde ⋯: bloquea mientras pende; luego banner, «En pausa», anuncio y foco en el h2 del banner", async () => {
    const patch = deferred<RoadmapDetail>();
    vi.mocked(setRoadmapPaused).mockReturnValue(patch.promise);
    const { user } = await renderLoaded();
    const liveRegion = announcer();

    await selectMenuItem(user, "Pausar ruta");

    expect(trigger()).toHaveAttribute("aria-disabled", "true");
    for (const button of completeButtons()) expect(button).toBeDisabled();
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][0]).toBe(ID);
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][1]).toEqual({
      paused: true,
      expectedActivityVersion: ROADMAP_DETAIL.activityVersion,
    });

    patch.resolve(buildPausedResponse());

    const region = await screen.findByRole("region", { name: "Esta ruta está en pausa" });
    await waitFor(() =>
      expect(document.activeElement).toBe(within(region).getByRole("heading", { level: 2 })),
    );
    expect(screen.getByText("En pausa")).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Continúa aquí" })).not.toBeInTheDocument();
    expect(announcer()).toBe(liveRegion);
    expect(liveRegion).toHaveTextContent(PAUSED_ANNOUNCEMENT);
    expect(trigger()).not.toHaveAttribute("aria-disabled");
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });

  it("reanudar desde el banner: «Reanudando…», luego «Continúa aquí», completar habilitado, anuncio y foco en el h1", async () => {
    const patch = deferred<RoadmapDetail>();
    vi.mocked(setRoadmapPaused).mockReturnValue(patch.promise);
    const { user } = await renderLoaded(buildPausedRoadmapDetail());

    await user.click(within(pausedRegion()).getByRole("button", { name: "Reanudar ruta" }));

    expect(within(pausedRegion()).getByRole("button", { name: "Reanudando…" })).toBeDisabled();
    expect(trigger()).toHaveAttribute("aria-disabled", "true");
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][1]).toEqual({
      paused: false,
      expectedActivityVersion: ROADMAP_DETAIL.activityVersion,
    });

    patch.resolve(buildResumedResponse());

    expect(await screen.findByRole("region", { name: "Continúa aquí" })).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()));
    expect(
      screen.queryByRole("region", { name: "Esta ruta está en pausa" }),
    ).not.toBeInTheDocument();
    for (const button of completeButtons()) expect(button).toBeEnabled();
    expect(announcer()).toHaveTextContent(RESUMED_ANNOUNCEMENT);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });

  it("reanudar desde ⋯: «Continúa aquí», anuncio y foco en el h1", async () => {
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildResumedResponse());
    const { user } = await renderLoaded(buildPausedRoadmapDetail());

    await selectMenuItem(user, "Reanudar ruta");

    expect(await screen.findByRole("region", { name: "Continúa aquí" })).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()));
    expect(announcer()).toHaveTextContent(RESUMED_ANNOUNCEMENT);
    expect(vi.mocked(setRoadmapPaused).mock.calls[0][1]).toMatchObject({ paused: false });
  });

  it("200 idempotente igual a lo pintado: el foco se mueve enseguida, sin esperar la cota", async () => {
    // El back devuelve la ruta tal cual (ya estaba en ese estado): structural sharing conserva la
    // referencia en caché, así que no hay re-render que esperar.
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildPausedRoadmapDetail());
    const { user } = await renderLoaded(buildPausedRoadmapDetail());

    await selectMenuItem(user, "Reanudar ruta");

    // Muy por debajo de FOCUS_REQUEST_MAX_WAIT_MS (1000 ms).
    await waitFor(
      () =>
        expect(document.activeElement).toBe(
          within(pausedRegion()).getByRole("heading", { level: 2 }),
        ),
      { timeout: 300 },
    );
    expect(announcer()).toHaveTextContent(PAUSED_ANNOUNCEMENT);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });

  it("reanudar → 200 COMPLETED: panel de completada, sin anuncio y foco en el h1", async () => {
    vi.mocked(setRoadmapPaused).mockResolvedValue(buildCompletedRoadmapDetail());
    const { user } = await renderLoaded(buildPausedRoadmapDetail());

    await user.click(within(pausedRegion()).getByRole("button", { name: "Reanudar ruta" }));

    expect(await screen.findByRole("region", { name: "Completaste la ruta" })).toBeInTheDocument();
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()));
    expect(announcer()).toBeEmptyDOMElement();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("409 ROADMAP_VERSION_CONFLICT: recarga la ruta (ya en pausa), aviso neutro y foco en el h1", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapVersionConflictError());
    const { user } = await renderLoaded();
    // Refetch tras el error.
    vi.mocked(getRoadmap).mockResolvedValueOnce(buildPausedResponse());

    await selectMenuItem(user, "Pausar ruta");

    expect(
      await screen.findByRole("region", { name: "Esta ruta está en pausa" }),
    ).toBeInTheDocument();
    const notice = await screen.findByText(UPDATED_ELSEWHERE);
    expect(notice).toHaveAttribute("role", "status");
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(announcer()).toBeEmptyDOMElement();
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);
    expect(getRoadmap).toHaveBeenCalledTimes(2);
  });

  it("409 INVALID_ROADMAP_TRANSITION: recarga la ruta completada, aviso neutro y foco en el h1", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildInvalidRoadmapTransitionError());
    const { user } = await renderLoaded();
    // Refetch tras el error.
    vi.mocked(getRoadmap).mockResolvedValueOnce(buildCompletedRoadmapDetail());

    await selectMenuItem(user, "Pausar ruta");

    expect(await screen.findByRole("region", { name: "Completaste la ruta" })).toBeInTheDocument();
    expect(await screen.findByText(UPDATED_ELSEWHERE)).toHaveAttribute("role", "status");
    await waitFor(() => expect(document.activeElement).toBe(mainHeading()));
    expect(setRoadmapPaused).toHaveBeenCalledTimes(1);
  });

  it("409 con el refetch fallido: se queda la vista previa, alerta genérica (no el aviso neutro) y el foco no se mueve", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapVersionConflictError());
    const { user } = await renderLoaded();
    // Refetch tras el error: falla por red, no confirma el conflicto de versión.
    vi.mocked(getRoadmap).mockRejectedValueOnce(buildAxiosError(500, "Internal server error"));

    await selectMenuItem(user, "Pausar ruta");

    expect(await screen.findByRole("alert")).toHaveTextContent(PAUSE_GENERIC_MESSAGE);
    expect(screen.queryByText(UPDATED_ELSEWHERE)).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Continúa aquí" })).toBeInTheDocument();
    expect(screen.queryByText("No pudimos cargar la ruta")).not.toBeInTheDocument();
    expect(document.activeElement).toBe(trigger());
    expect(getRoadmap).toHaveBeenCalledTimes(2);
  });

  it("404 con la ruta borrada: «No encontramos esta ruta»", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapNotFoundError());
    const { user } = await renderLoaded();
    // Refetch tras el error.
    vi.mocked(getRoadmap).mockRejectedValueOnce(buildRoadmapNotFoundError());

    await selectMenuItem(user, "Pausar ruta");

    expect(
      await screen.findByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Roadmap not found.")).not.toBeInTheDocument();
  });

  it("404 desde ⋯ con el refetch interno fallido: se queda la vista previa, alerta genérica y el foco no se mueve", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapNotFoundError());
    const { user } = await renderLoaded();
    // Refetch tras el error: falla por red, no confirma el 404. El Notice usa el error original
    // (el 404 de pausar, que sí tiene respuesta), no el de la red.
    vi.mocked(getRoadmap).mockRejectedValueOnce(buildNetworkError());

    await selectMenuItem(user, "Pausar ruta");

    expect(await screen.findByRole("alert")).toHaveTextContent(PAUSE_GENERIC_MESSAGE);
    expect(
      screen.queryByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).not.toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Continúa aquí" })).toBeInTheDocument();
    expect(document.activeElement).toBe(trigger());
    expect(trigger()).not.toHaveAttribute("aria-disabled");
    expect(announcer()).toBeEmptyDOMElement();
    expect(getRoadmap).toHaveBeenCalledTimes(2);
  });

  it("404 desde el banner con el refetch interno fallido: alerta genérica y el foco vuelve a «Reanudar ruta»", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildRoadmapNotFoundError());
    const { user } = await renderLoaded(buildPausedRoadmapDetail());
    // Refetch tras el error: falla por red, no confirma el 404.
    vi.mocked(getRoadmap).mockRejectedValueOnce(buildNetworkError());

    await user.click(within(pausedRegion()).getByRole("button", { name: "Reanudar ruta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(RESUME_GENERIC_MESSAGE);
    const button = within(pausedRegion()).getByRole("button", { name: "Reanudar ruta" });
    await waitFor(() => expect(document.activeElement).toBe(button));
    expect(button).toBeEnabled();
    expect(
      screen.queryByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).not.toBeInTheDocument();
  });

  it("404 con refetch fallido, luego reintento con éxito: la alerta desaparece y sigue el flujo normal", async () => {
    vi.mocked(setRoadmapPaused)
      .mockRejectedValueOnce(buildRoadmapNotFoundError())
      .mockResolvedValueOnce(buildPausedResponse());
    const { user } = await renderLoaded();
    vi.mocked(getRoadmap).mockRejectedValueOnce(buildNetworkError());

    await selectMenuItem(user, "Pausar ruta");

    expect(await screen.findByRole("alert")).toHaveTextContent(PAUSE_GENERIC_MESSAGE);

    await selectMenuItem(user, "Pausar ruta");

    expect(
      await screen.findByRole("region", { name: "Esta ruta está en pausa" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(announcer()).toHaveTextContent(PAUSED_ANNOUNCEMENT);
    expect(setRoadmapPaused).toHaveBeenCalledTimes(2);
  });

  it("sin conexión: alerta arriba, el foco sigue en ⋯ y un reintento correcto la limpia", async () => {
    vi.mocked(setRoadmapPaused)
      .mockRejectedValueOnce(buildNetworkError())
      .mockResolvedValueOnce(buildPausedResponse());
    const { user } = await renderLoaded();

    await selectMenuItem(user, "Pausar ruta");

    expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
    expect(document.activeElement).toBe(trigger());
    expect(getRoadmap).toHaveBeenCalledTimes(1);

    await selectMenuItem(user, "Pausar ruta");

    expect(
      await screen.findByRole("region", { name: "Esta ruta está en pausa" }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(announcer()).toHaveTextContent(PAUSED_ANNOUNCEMENT);
    expect(setRoadmapPaused).toHaveBeenCalledTimes(2);
  });

  it("sin conexión al reanudar desde el banner: el foco vuelve a su «Reanudar ruta»", async () => {
    vi.mocked(setRoadmapPaused).mockRejectedValue(buildNetworkError());
    const { user } = await renderLoaded(buildPausedRoadmapDetail());

    await user.click(within(pausedRegion()).getByRole("button", { name: "Reanudar ruta" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
    const button = within(pausedRegion()).getByRole("button", { name: "Reanudar ruta" });
    await waitFor(() => expect(document.activeElement).toBe(button));
    expect(button).toBeEnabled();
  });

  it("eliminar desde ⋯ navega a Mis Rutas con replace y el state de borrado", async () => {
    vi.mocked(deleteRoadmap).mockResolvedValue({ id: ID });
    vi.mocked(getRoadmap).mockResolvedValueOnce(ROADMAP_DETAIL);
    function MisRutasStub() {
      const location = useLocation();
      const navigationType = useNavigationType();
      return (
        <>
          <h1>Mis Rutas</h1>
          <output data-testid="arrival">
            {navigationType} {JSON.stringify(location.state)}
          </output>
        </>
      );
    }
    const user = userEvent.setup();
    renderWithProviders(
      <Routes>
        <Route path="/dashboard/roadmaps" element={<MisRutasStub />} />
        <Route path="/dashboard/roadmaps/:roadmapId" element={<RoadmapDetailPage />} />
      </Routes>,
      { route: `/dashboard/roadmaps/${ID}` },
    );
    expect(await roadmapHeading()).toBeInTheDocument();

    await selectMenuItem(user, "Eliminar ruta");
    await user.click(
      within(screen.getByRole("dialog", { name: `¿Eliminar ${NAME}?` })).getByRole("button", {
        name: "Eliminar ruta",
      }),
    );

    expect(await screen.findByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
    expect(screen.getByTestId("arrival")).toHaveTextContent(
      `REPLACE ${JSON.stringify({ roadmapDeleted: { name: NAME, notFound: false } })}`,
    );
    expect(vi.mocked(deleteRoadmap).mock.calls[0][0]).toBe(ID);
    expect(getRoadmap).toHaveBeenCalledTimes(1);
  });
});
