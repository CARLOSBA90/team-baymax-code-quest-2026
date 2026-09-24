import { act, fireEvent, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useLogout, useSession } from "@/api/queries/auth";
import { deleteRoadmap, getRoadmaps } from "@/api/services";
import { DashboardLayout } from "@/components/layouts";
import { ASSESSMENT_COMPLETED_STATE } from "@/lib";
import { RoadmapsPage } from "@/pages";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import {
  buildRoadmapSummary,
  buildRoadmapsListResult,
  EMPTY_ROADMAPS_RESULT,
  ROADMAPS_LIST_RESULT,
} from "@/test/fixtures/roadmaps";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapsListResult } from "@/types";

vi.mock("@/api/services", () => ({ getRoadmaps: vi.fn(), deleteRoadmap: vi.fn() }));
// Solo lo usa el `DashboardLayout` del test de la pill del sidebar.
vi.mock("@/api/queries/auth", () => ({ useSession: vi.fn(), useLogout: vi.fn() }));

const SUCCESS_NOTICE =
  "¡Cuestionario completado! Guardamos tus respuestas; pronto verás aquí tu ruta recomendada.";

const FE = "Frontend moderno con React";
const BE = "Backend con Node y NestJS";
const JS = "Fundamentos de JavaScript y TypeScript";
const MO = "Apps móviles con Flutter";
const DO = "Git, Docker y despliegue";
const ALL_NAMES = [FE, BE, JS, MO, DO];
const NETWORK_MESSAGE =
  "No se pudo conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.";

function deferred<T>() {
  let resolve!: (value: T) => void;
  let reject!: (reason: unknown) => void;
  const promise = new Promise<T>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

function LocationProbe() {
  const location = useLocation();
  return <p data-testid="location">{`${location.pathname}${location.search}`}</p>;
}

/** Página real + destinos de navegación (cuestionario y detalle) + sonda de URL. */
function renderListPage(route = "/dashboard/roadmaps") {
  const utils = renderWithProviders(
    <>
      <Routes>
        <Route path="/dashboard/roadmaps" element={<RoadmapsPage />} />
        <Route path="/dashboard/roadmaps/new" element={<p>Cuestionario</p>} />
        <Route path="/dashboard/roadmaps/:roadmapId" element={<p>Detalle</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route },
  );
  return { ...utils, user: userEvent.setup() };
}

function currentUrl() {
  return screen.getByTestId("location").textContent;
}

function table() {
  return screen.getByRole("table", { name: "Tus rutas de aprendizaje" });
}

function cardList() {
  return screen.getByRole("list", { name: "Tus rutas de aprendizaje" });
}

/** Nombres de las filas de la tabla (el nombre sale dos veces por fila: `<p>` + sr-only). */
function tableNames() {
  return within(table())
    .getAllByRole("row")
    .slice(1)
    .map((row) => within(row).getByText(/./, { selector: "p[title]" }).textContent);
}

function cardNames() {
  return within(cardList())
    .getAllByRole("heading", { level: 3 })
    .map((heading) => heading.textContent);
}

function filterButton(name: RegExp) {
  return within(screen.getByRole("group", { name: "Filtrar rutas por estado" })).getByRole(
    "button",
    { name },
  );
}

async function waitForList() {
  await screen.findByRole("table", { name: "Tus rutas de aprendizaje" });
}

/** Harness de `design.md`: remontaje en la misma entrada (≈ recarga) y atrás/adelante. */
function Harness() {
  const [mountKey, setMountKey] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();
  return (
    <>
      <Routes>
        <Route path="/dashboard/roadmaps" element={<RoadmapsPage key={mountKey} />} />
        <Route
          path="/dashboard/roadmaps/new"
          element={
            <>
              <p>Cuestionario</p>
              <button type="button" onClick={() => navigate("/dashboard/roadmaps")}>
                Salir
              </button>
            </>
          }
        />
      </Routes>
      <p data-testid="location-state">{JSON.stringify(location.state ?? null)}</p>
      <button type="button" onClick={() => setMountKey((key) => key + 1)}>
        Remontar
      </button>
      <button type="button" onClick={() => navigate(-1)}>
        Atrás
      </button>
      <button type="button" onClick={() => navigate(1)}>
        Adelante
      </button>
      <button
        type="button"
        onClick={() => navigate("/dashboard/roadmaps", { state: ASSESSMENT_COMPLETED_STATE })}
      >
        Completar
      </button>
    </>
  );
}

/** Por defecto la entrada previa es el cuestionario; con `previous` se elige otra. */
function renderHarness(previous = "/dashboard/roadmaps/new") {
  renderWithProviders(<Harness />, {
    initialEntries: [
      previous,
      { pathname: "/dashboard/roadmaps", state: ASSESSMENT_COMPLETED_STATE },
    ],
    initialIndex: 1,
  });
  return userEvent.setup();
}

function notice() {
  return screen.getByText(SUCCESS_NOTICE);
}

/** Espera a que `RoadmapsPage` limpie el `state` de la entrada con `replace`. */
async function expectStateCleared() {
  await waitFor(() => expect(screen.getByTestId("location-state")).toHaveTextContent("null"));
}

describe("RoadmapsPage", () => {
  beforeEach(() => {
    vi.mocked(getRoadmaps).mockResolvedValue(EMPTY_ROADMAPS_RESULT);
  });

  it("no renderiza main propio ni la clase .nebula mientras carga", () => {
    const { container } = renderWithProviders(<RoadmapsPage />);
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(container.querySelector(".nebula")).toBeNull();
  });

  describe("carga y error", () => {
    it("mientras carga muestra el esqueleto y solo el h1, sin resumen, filtros, CTA ni estado vacío", () => {
      vi.mocked(getRoadmaps).mockReturnValue(new Promise(() => {}));
      renderWithProviders(<RoadmapsPage />);

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.getByRole("status")).toHaveTextContent("Cargando rutas…");
      expect(screen.getByRole("status").parentElement).toHaveAttribute("aria-busy", "true");
      expect(screen.queryByText(/rutas ·/)).not.toBeInTheDocument();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByRole("button", { name: /Crear nueva ruta/ })).not.toBeInTheDocument();
      expect(screen.queryByText("Aún no tienes rutas")).not.toBeInTheDocument();
      expect(screen.queryByText(FE)).not.toBeInTheDocument();
    });

    it("con error muestra el mensaje y Reintentar vuelve a pedir y muestra la lista", async () => {
      vi.mocked(getRoadmaps).mockRejectedValueOnce(buildNetworkError());
      const retry = deferred<RoadmapsListResult>();
      vi.mocked(getRoadmaps).mockReturnValueOnce(retry.promise);
      const { user } = renderListPage();

      expect(await screen.findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
      expect(screen.queryByText(/rutas ·/)).not.toBeInTheDocument();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Reintentar" }));
      expect(await screen.findByText("Cargando rutas…")).toBeInTheDocument();
      await act(async () => retry.resolve(ROADMAPS_LIST_RESULT));

      await waitForList();
      expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      expect(getRoadmaps).toHaveBeenCalledTimes(2);
    });
  });

  describe("sin rutas", () => {
    it("muestra el estado vacío con su CTA y ni filtros, ni tabla, ni cards, ni resumen", async () => {
      renderWithProviders(<RoadmapsPage />);

      expect(
        await screen.findByRole("heading", { level: 2, name: "Aún no tienes rutas" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(
        screen.getByText("Aquí aparecerán las rutas de aprendizaje que crees."),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Crear mi primera ruta" })).toBeInTheDocument();
      expect(screen.queryByRole("group")).not.toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "Tus rutas de aprendizaje" })).toBeNull();
      expect(screen.queryByText(/rutas ·/)).not.toBeInTheDocument();
      expect(screen.queryByText(/@/)).not.toBeInTheDocument();
    });
  });

  describe("con rutas", () => {
    beforeEach(() => {
      vi.mocked(getRoadmaps).mockResolvedValue(ROADMAPS_LIST_RESULT);
    });

    it("lista las 5 rutas en tabla y cards, sin estado vacío", async () => {
      renderListPage();
      await waitForList();

      expect(tableNames()).toEqual(ALL_NAMES);
      expect(cardNames()).toEqual(ALL_NAMES);
      expect(table()).toHaveClass("hidden", "lg:table");
      expect(cardList()).toHaveClass("lg:hidden");
      expect(screen.queryByText("Aún no tienes rutas")).not.toBeInTheDocument();
      expect(getRoadmaps).toHaveBeenCalledTimes(1);
      expect(getRoadmaps).toHaveBeenCalledWith();
    });

    it("muestra el resumen global y el CTA Crear nueva ruta de aprendizaje", async () => {
      renderListPage();
      await waitForList();

      expect(screen.getByText("5 rutas · 2 en curso · 2 completadas")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Crear nueva ruta de aprendizaje" }),
      ).toBeInTheDocument();
      expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    });

    it("el resumen no cambia con el filtro activo", async () => {
      renderListPage("/dashboard/roadmaps?status=paused");
      await waitForList();
      expect(screen.getByText("5 rutas · 2 en curso · 2 completadas")).toBeInTheDocument();
    });

    it("el CTA navega a /dashboard/roadmaps/new", async () => {
      const { user } = renderListPage();
      await waitForList();

      await user.click(screen.getByRole("button", { name: "Crear nueva ruta de aprendizaje" }));

      expect(screen.getByText("Cuestionario")).toBeInTheDocument();
      expect(currentUrl()).toBe("/dashboard/roadmaps/new");
    });

    it("muestra los counts de cada filtro y Todas seleccionado por defecto", async () => {
      renderListPage();
      await waitForList();

      const group = screen.getByRole("group", { name: "Filtrar rutas por estado" });
      expect(
        within(group)
          .getAllByRole("button")
          .map((button) => button.textContent),
      ).toEqual(["Todas 5", "Empezadas 2", "En pausa 1", "Completadas 2"]);
      expect(filterButton(/^Todas/)).toHaveAttribute("aria-pressed", "true");
      for (const name of [/^Empezadas/, /^En pausa/, /^Completadas/]) {
        expect(filterButton(name)).toHaveAttribute("aria-pressed", "false");
      }
    });

    it("Completadas filtra al instante en memoria (sin esqueleto ni nueva petición) y actualiza la URL", async () => {
      const { user } = renderListPage();
      await waitForList();

      await user.click(filterButton(/^Completadas/));

      expect(tableNames()).toEqual([JS, DO]);
      expect(cardNames()).toEqual([JS, DO]);
      expect(within(table()).queryByText(FE, { selector: "p" })).not.toBeInTheDocument();
      expect(filterButton(/^Completadas/)).toHaveAttribute("aria-pressed", "true");
      expect(filterButton(/^Todas/)).toHaveAttribute("aria-pressed", "false");
      expect(screen.queryByText("Cargando rutas…")).not.toBeInTheDocument();
      expect(currentUrl()).toBe("/dashboard/roadmaps?status=completed");
      expect(getRoadmaps).toHaveBeenCalledTimes(1);
    });

    it("Empezadas pone ?status=in_progress y Todas borra el parámetro", async () => {
      const { user } = renderListPage();
      await waitForList();

      await user.click(filterButton(/^Empezadas/));
      expect(currentUrl()).toBe("/dashboard/roadmaps?status=in_progress");
      expect(tableNames()).toEqual([FE, MO]);

      await user.click(filterButton(/^Todas/));
      expect(currentUrl()).toBe("/dashboard/roadmaps");
      expect(tableNames()).toEqual(ALL_NAMES);
      expect(getRoadmaps).toHaveBeenCalledTimes(1);
    });

    it("cambiar de filtro reemplaza la entrada del historial (no la apila)", async () => {
      function Back() {
        const navigate = useNavigate();
        return (
          <button type="button" onClick={() => navigate(-1)}>
            Atrás
          </button>
        );
      }
      renderWithProviders(
        <>
          <Routes>
            <Route path="/inicio" element={<p>Inicio</p>} />
            <Route path="/dashboard/roadmaps" element={<RoadmapsPage />} />
          </Routes>
          <LocationProbe />
          <Back />
        </>,
        { initialEntries: ["/inicio", "/dashboard/roadmaps"], initialIndex: 1 },
      );
      const user = userEvent.setup();
      await waitForList();

      await user.click(filterButton(/^En pausa/));
      await user.click(filterButton(/^Completadas/));
      await user.click(screen.getByRole("button", { name: "Atrás" }));

      expect(currentUrl()).toBe("/inicio");
    });

    it("?status=paused selecciona En pausa y lista solo BE", async () => {
      renderListPage("/dashboard/roadmaps?status=paused");
      await waitForList();

      expect(filterButton(/^En pausa/)).toHaveAttribute("aria-pressed", "true");
      expect(tableNames()).toEqual([BE]);
      expect(cardNames()).toEqual([BE]);
    });

    it.each(["foo", "not_started"])("?status=%s cae a Todas con las 5 rutas", async (status) => {
      renderListPage(`/dashboard/roadmaps?status=${status}`);
      await waitForList();

      expect(filterButton(/^Todas/)).toHaveAttribute("aria-pressed", "true");
      expect(tableNames()).toEqual(ALL_NAMES);
    });

    it("una ruta NOT_STARTED solo aparece en Todas", async () => {
      const pending = buildRoadmapSummary({
        id: "rm-new",
        name: "Ruta sin empezar",
        status: "NOT_STARTED",
        progress: 0,
      });
      vi.mocked(getRoadmaps).mockResolvedValue(
        buildRoadmapsListResult({ items: [...ROADMAPS_LIST_RESULT.items, pending] }),
      );
      const { user } = renderListPage();
      await waitForList();

      expect(tableNames()).toContain("Ruta sin empezar");
      for (const name of [/^Empezadas/, /^En pausa/, /^Completadas/]) {
        await user.click(filterButton(name));
        expect(tableNames()).not.toContain("Ruta sin empezar");
        expect(cardNames()).not.toContain("Ruta sin empezar");
      }
    });

    it("un filtro sin rutas muestra su mensaje y conserva cabecera y filtros", async () => {
      vi.mocked(getRoadmaps).mockResolvedValue(
        buildRoadmapsListResult({
          items: ROADMAPS_LIST_RESULT.items.filter((roadmap) => roadmap.status !== "PAUSED"),
        }),
      );
      const { user } = renderListPage();
      await waitForList();

      await user.click(filterButton(/^En pausa/));

      expect(screen.getByRole("status")).toHaveTextContent("No tienes rutas en pausa.");
      expect(filterButton(/^En pausa/)).toHaveAttribute("aria-pressed", "true");
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      expect(screen.queryByRole("list", { name: "Tus rutas de aprendizaje" })).toBeNull();
      expect(screen.queryByText("Aún no tienes rutas")).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Crear nueva ruta de aprendizaje" }),
      ).toBeInTheDocument();
    });

    it("la acción de la fila navega al detalle de la ruta", async () => {
      const { user } = renderListPage();
      await waitForList();

      await user.click(within(table()).getByRole("link", { name: `Reanudar ${BE}` }));

      expect(screen.getByText("Detalle")).toBeInTheDocument();
      expect(currentUrl()).toBe("/dashboard/roadmaps/rm-backend-nest");
    });

    it("el enlace de la card navega al detalle de la ruta", async () => {
      const { user } = renderListPage();
      await waitForList();

      await user.click(within(cardList()).getByRole("link", { name: JS }));

      expect(currentUrl()).toBe("/dashboard/roadmaps/rm-js-ts");
    });

    it("el aviso de cuestionario completado convive con la lista", async () => {
      renderWithProviders(<RoadmapsPage />, {
        route: { pathname: "/dashboard/roadmaps", state: ASSESSMENT_COMPLETED_STATE },
      });

      await waitForList();
      expect(screen.getByText(SUCCESS_NOTICE)).toHaveAttribute("role", "status");
      expect(tableNames()).toEqual(ALL_NAMES);
    });
  });

  describe("Eliminar ruta", () => {
    const FE_ID = "rm-frontend-react";
    const FE_DELETED_NOTICE = `Ruta «${FE}» eliminada`;
    const NOT_FOUND_NOTICE = "Esa ruta ya no existe. Hemos actualizado tu lista.";
    const GENERIC_DELETE_ERROR = "No se pudo eliminar la ruta. Inténtalo de nuevo.";
    const WITHOUT_FE = buildRoadmapsListResult({
      items: ROADMAPS_LIST_RESULT.items.filter((roadmap) => roadmap.id !== FE_ID),
    });

    beforeEach(() => {
      vi.mocked(getRoadmaps).mockResolvedValueOnce(ROADMAPS_LIST_RESULT);
      // Tras borrar, la invalidación vuelve a pedir la lista: el back ya no la tiene.
      vi.mocked(getRoadmaps).mockResolvedValue(WITHOUT_FE);
      vi.mocked(deleteRoadmap).mockResolvedValue({ id: FE_ID });
    });

    function kebab(scope: HTMLElement, name = FE) {
      return within(scope).getByRole("button", { name: `Más acciones para ${name}` });
    }

    async function openDeleteDialog(
      user: ReturnType<typeof userEvent.setup>,
      scope: HTMLElement = table(),
      name = FE,
    ) {
      await user.click(kebab(scope, name));
      await user.click(screen.getByRole("menuitem", { name: "Eliminar ruta" }));
      return screen.getByRole("dialog", { name: `¿Eliminar ${name}?` });
    }

    function confirmButton() {
      return screen.getByRole("button", { name: /^(Eliminar ruta|Eliminando…)$/ });
    }

    function heading() {
      return screen.getByRole("heading", { level: 1, name: "Mis Rutas" });
    }

    it("desde el kebab de la tabla abre el diálogo de esa ruta sin llamar al back ni navegar", async () => {
      const { user } = renderListPage();
      await waitForList();

      const dialog = await openDeleteDialog(user);

      expect(dialog).toHaveAccessibleDescription(/progreso y tus entregas/);
      expect(screen.queryByRole("menu")).not.toBeInTheDocument();
      expect(deleteRoadmap).not.toHaveBeenCalled();
      expect(currentUrl()).toBe("/dashboard/roadmaps");
      expect(tableNames()).toContain(FE);
    });

    it("desde el kebab de la card abre el diálogo de esa ruta", async () => {
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user, cardList(), BE);

      expect(screen.getByRole("dialog", { name: `¿Eliminar ${BE}?` })).toBeInTheDocument();
      expect(currentUrl()).toBe("/dashboard/roadmaps");
    });

    it("Cancelar cierra sin llamar al back, sin aviso y devuelve el foco al kebab", async () => {
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user);
      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(deleteRoadmap).not.toHaveBeenCalled();
      expect(tableNames()).toContain(FE);
      expect(screen.queryByText(/eliminada$/)).not.toBeInTheDocument();
      expect(kebab(table())).toHaveFocus();
    });

    it("confirmar elimina la ruta: cierra el diálogo, la quita de tabla y cards, avisa y enfoca el h1", async () => {
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(await screen.findByText(FE_DELETED_NOTICE)).toHaveAttribute("role", "status");
      expect(deleteRoadmap).toHaveBeenCalledTimes(1);
      expect(vi.mocked(deleteRoadmap).mock.calls[0][0]).toBe(FE_ID);
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(tableNames()).not.toContain(FE);
      expect(cardNames()).not.toContain(FE);
      expect(screen.getByText("4 rutas · 1 en curso · 2 completadas")).toBeInTheDocument();
      expect(heading()).toHaveAttribute("tabindex", "-1");
      await waitFor(() => expect(heading()).toHaveFocus());
      await waitFor(() => expect(getRoadmaps).toHaveBeenCalledTimes(2));
      expect(tableNames()).not.toContain(FE);
    });

    it("mientras está pendiente: Eliminando…, botones deshabilitados, Esc no cierra y una sola llamada", async () => {
      const pending = deferred<{ id: string }>();
      vi.mocked(deleteRoadmap).mockReturnValue(pending.promise);
      const { user } = renderListPage();
      await waitForList();

      const dialog = await openDeleteDialog(user);
      await user.click(confirmButton());

      const busy = screen.getByRole("button", { name: "Eliminando…" });
      expect(busy).toBeDisabled();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeDisabled();
      fireEvent(dialog, new Event("cancel", { cancelable: true }));
      await user.click(screen.getByRole("button", { name: "Cerrar diálogo" }));
      await user.click(busy);
      expect(screen.getByRole("dialog", { name: `¿Eliminar ${FE}?` })).toBeInTheDocument();
      expect(tableNames()).toContain(FE);
      expect(deleteRoadmap).toHaveBeenCalledTimes(1);

      await act(async () => pending.resolve({ id: FE_ID }));
      expect(await screen.findByText(FE_DELETED_NOTICE)).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    });

    it("eliminar la última ruta muestra el estado vacío", async () => {
      const only = ROADMAPS_LIST_RESULT.items.filter((roadmap) => roadmap.id === FE_ID);
      vi.mocked(getRoadmaps).mockReset();
      vi.mocked(getRoadmaps).mockResolvedValueOnce(buildRoadmapsListResult({ items: only }));
      vi.mocked(getRoadmaps).mockResolvedValue(EMPTY_ROADMAPS_RESULT);
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(
        await screen.findByRole("heading", { level: 2, name: "Aún no tienes rutas" }),
      ).toBeInTheDocument();
      expect(screen.getByText(FE_DELETED_NOTICE)).toBeInTheDocument();
      expect(screen.queryByRole("table")).not.toBeInTheDocument();
      await waitFor(() => expect(heading()).toHaveFocus());
    });

    it("eliminar la última ruta del filtro activo muestra su mensaje y conserva el filtro", async () => {
      const inProgressOnlyFe = buildRoadmapsListResult({
        items: ROADMAPS_LIST_RESULT.items.filter((roadmap) => roadmap.id !== "rm-flutter"),
      });
      vi.mocked(getRoadmaps).mockReset();
      vi.mocked(getRoadmaps).mockResolvedValueOnce(inProgressOnlyFe);
      vi.mocked(getRoadmaps).mockResolvedValue(
        buildRoadmapsListResult({
          items: inProgressOnlyFe.items.filter((roadmap) => roadmap.id !== FE_ID),
        }),
      );
      const { user } = renderListPage("/dashboard/roadmaps?status=in_progress");
      await waitForList();
      expect(tableNames()).toEqual([FE]);

      await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(await screen.findByText("No tienes rutas empezadas.")).toBeInTheDocument();
      expect(filterButton(/^Empezadas/)).toHaveAttribute("aria-pressed", "true");
      expect(currentUrl()).toBe("/dashboard/roadmaps?status=in_progress");
      expect(screen.getByText(FE_DELETED_NOTICE)).toBeInTheDocument();
    });

    it("404: cierra el diálogo, quita la ruta, muestra el aviso neutral (sin el message del back) y enfoca el h1", async () => {
      vi.mocked(deleteRoadmap).mockRejectedValue(
        buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" }),
      );
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(await screen.findByText(NOT_FOUND_NOTICE)).toHaveAttribute("role", "status");
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(tableNames()).not.toContain(FE);
      expect(screen.queryByText("Roadmap not found.")).not.toBeInTheDocument();
      expect(screen.queryByText(FE_DELETED_NOTICE)).not.toBeInTheDocument();
      await waitFor(() => expect(heading()).toHaveFocus());
    });

    it("500: muestra el error en español dentro del diálogo y reintentar elimina la ruta", async () => {
      vi.mocked(deleteRoadmap)
        .mockRejectedValueOnce(buildAxiosError(500, "Internal server error"))
        .mockResolvedValueOnce({ id: FE_ID });
      const { user } = renderListPage();
      await waitForList();

      const dialog = await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(GENERIC_DELETE_ERROR);
      expect(screen.queryByText("Internal server error")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Eliminar ruta" })).toBeEnabled();
      expect(screen.getByRole("button", { name: "Cancelar" })).toBeEnabled();
      expect(tableNames()).toContain(FE);
      expect(getRoadmaps).toHaveBeenCalledTimes(1);

      await user.click(confirmButton());

      expect(await screen.findByText(FE_DELETED_NOTICE)).toBeInTheDocument();
      expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
      expect(deleteRoadmap).toHaveBeenCalledTimes(2);
    });

    it("error de red: el diálogo sigue abierto con el mensaje de conexión y la ruta sigue listada", async () => {
      vi.mocked(deleteRoadmap).mockRejectedValue(buildNetworkError());
      const { user } = renderListPage();
      await waitForList();

      const dialog = await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(await within(dialog).findByRole("alert")).toHaveTextContent(NETWORK_MESSAGE);
      expect(screen.getByRole("dialog", { name: `¿Eliminar ${FE}?` })).toBeInTheDocument();
      expect(tableNames()).toContain(FE);
      expect(cardNames()).toContain(FE);
    });

    it("reabrir tras un error cancelado no muestra el error previo", async () => {
      vi.mocked(deleteRoadmap).mockRejectedValue(buildAxiosError(500));
      const { user } = renderListPage();
      await waitForList();

      const dialog = await openDeleteDialog(user);
      await user.click(confirmButton());
      await within(dialog).findByRole("alert");
      await user.click(screen.getByRole("button", { name: "Cancelar" }));

      const reopened = await openDeleteDialog(user, table(), BE);

      expect(within(reopened).queryByRole("alert")).not.toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Eliminar ruta" })).toBeEnabled();
    });

    it("cambiar de filtro oculta el aviso", async () => {
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user);
      await user.click(confirmButton());
      expect(await screen.findByText(FE_DELETED_NOTICE)).toBeInTheDocument();

      await user.click(filterButton(/^Completadas/));

      expect(screen.queryByText(FE_DELETED_NOTICE)).not.toBeInTheDocument();
    });

    it("un segundo borrado reemplaza el aviso", async () => {
      vi.mocked(deleteRoadmap)
        .mockResolvedValueOnce({ id: FE_ID })
        .mockResolvedValueOnce({ id: "rm-backend-nest" });
      const { user } = renderListPage();
      await waitForList();

      await openDeleteDialog(user);
      await user.click(confirmButton());
      expect(await screen.findByText(FE_DELETED_NOTICE)).toBeInTheDocument();

      await openDeleteDialog(user, table(), BE);
      await user.click(confirmButton());

      expect(await screen.findByText(`Ruta «${BE}» eliminada`)).toBeInTheDocument();
      expect(screen.queryByText(FE_DELETED_NOTICE)).not.toBeInTheDocument();
      expect(vi.mocked(deleteRoadmap).mock.lastCall?.[0]).toBe("rm-backend-nest");
    });

    it("la pill de Mis Rutas del sidebar baja a 4 rutas tras eliminar", async () => {
      vi.mocked(useSession).mockReturnValue({
        data: { user: { name: "Ada Lovelace", email: "ada@example.com" } },
      } as unknown as ReturnType<typeof useSession>);
      vi.mocked(useLogout).mockReturnValue({
        mutate: vi.fn(),
        isPending: false,
        error: null,
      } as unknown as ReturnType<typeof useLogout>);
      renderWithProviders(
        <Routes>
          <Route element={<DashboardLayout />}>
            <Route path="/dashboard/roadmaps" element={<RoadmapsPage />} />
          </Route>
        </Routes>,
        { route: "/dashboard/roadmaps" },
      );
      const user = userEvent.setup();
      const sidebarLink = () =>
        within(screen.getByRole("navigation", { name: "Navegación principal" })).getByRole("link", {
          name: /^Mis Rutas(, \d+ rutas?)?$/,
        });
      await waitForList();
      expect(sidebarLink()).toHaveAccessibleName("Mis Rutas, 5 rutas");

      await openDeleteDialog(user);
      await user.click(confirmButton());

      expect(await screen.findByText(FE_DELETED_NOTICE)).toBeInTheDocument();
      expect(sidebarLink()).toHaveAccessibleName("Mis Rutas, 4 rutas");
    });
  });

  describe("aviso de cuestionario completado", () => {
    it("sin state no muestra el aviso", () => {
      renderWithProviders(<RoadmapsPage />, { route: "/dashboard/roadmaps" });
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
    });

    it("con el state de cuestionario completado muestra el aviso y después limpia el state", async () => {
      renderHarness();

      expect(notice()).toHaveAttribute("role", "status");
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(
        await screen.findByRole("heading", { level: 2, name: "Aún no tienes rutas" }),
      ).toBeInTheDocument();
      expect(screen.getByRole("button", { name: "Crear mi primera ruta" })).toBeInTheDocument();

      await expectStateCleared();
      expect(notice()).toBeInTheDocument();
    });

    it.each([
      ["{ foo: 1 }", { foo: 1 }],
      ['"x"', "x"],
      ['{ assessmentCompleted: "true" }', { assessmentCompleted: "true" }],
    ])("con un state de otra forma (%s) no muestra el aviso", (_label, state) => {
      renderWithProviders(<RoadmapsPage />, {
        route: { pathname: "/dashboard/roadmaps", state },
      });
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
    });

    it("al remontar sobre la misma entrada (≈ recarga) no vuelve a mostrar el aviso", async () => {
      const user = renderHarness();

      expect(notice()).toBeInTheDocument();
      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Remontar" }));

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
    });

    it("con atrás y adelante no vuelve a mostrar el aviso", async () => {
      const user = renderHarness();

      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Atrás" }));
      expect(screen.getByText("Cuestionario")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Adelante" }));

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
      expect(screen.getByTestId("location-state")).toHaveTextContent("null");
    });

    it("con atrás hasta otra entrada de Mis Rutas (sin remontar) y adelante no muestra el aviso", async () => {
      // Flujo real: Mis Rutas → Crear mi primera ruta → enviar (replace) → Atrás.
      const user = renderHarness("/dashboard/roadmaps");

      expect(notice()).toBeInTheDocument();
      await expectStateCleared();
      expect(notice()).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Atrás" }));
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Adelante" }));
      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
    });

    it("si llega el state con la página ya montada, muestra el aviso y limpia el state", async () => {
      const user = renderHarness("/dashboard/roadmaps");
      await expectStateCleared();
      await user.click(screen.getByRole("button", { name: "Atrás" }));
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Completar" }));

      expect(notice()).toBeInTheDocument();
      await expectStateCleared();
      expect(notice()).toBeInTheDocument();
    });

    it("tras Crear mi primera ruta y volver sin state no muestra el aviso", async () => {
      const user = renderHarness();

      expect(notice()).toBeInTheDocument();
      await expectStateCleared();
      await user.click(await screen.findByRole("button", { name: "Crear mi primera ruta" }));
      expect(screen.getByText("Cuestionario")).toBeInTheDocument();

      await user.click(screen.getByRole("button", { name: "Salir" }));

      expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
      expect(screen.queryByText(SUCCESS_NOTICE)).not.toBeInTheDocument();
    });
  });
});
