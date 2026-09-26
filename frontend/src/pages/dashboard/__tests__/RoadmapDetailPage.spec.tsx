import { QueryClient } from "@tanstack/react-query";
import { screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { getRoadmap, trackItemCompletion } from "@/api/services";
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
  buildRoadmapDetail,
  ROADMAP_DETAIL,
} from "@/test/fixtures/roadmap-detail";
import { createTestQueryClient, renderWithProviders } from "@/test/renderWithProviders";
import { byTextContent } from "@/test/textContent";
import type { RoadmapDetail } from "@/types";

vi.mock("@/api/services", () => ({ getRoadmap: vi.fn(), trackItemCompletion: vi.fn() }));

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
      nextStep: { roadmapItemId: "item-3", name: ITEM_NAME, url: null },
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

    await openAndConfirm(user);

    const region = await screen.findByRole("region", { name: "Completaste la ruta" });
    await waitFor(() =>
      expect(document.activeElement).toBe(
        within(region).getByRole("heading", { level: 2, name: "Completaste la ruta" }),
      ),
    );
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

  it("422: el paso recargado muestra su mensaje de seguimiento y el foco va a su h3", async () => {
    const refreshed = buildFlowRoadmap();
    refreshed.items[2] = {
      ...refreshed.items[2],
      tracking: { type: "LESSONS", enabled: true, disabledReason: null },
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
      expect(
        within(row).getByText("El avance de este curso se registra por lección."),
      ).toBeInTheDocument(),
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
