import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Link, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { getRoadmap } from "@/api/services";
import { RoadmapDetailPage } from "@/pages";
import { buildAxiosError, buildNetworkError } from "@/test/fixtures/api-errors";
import { buildRoadmapDetail, ROADMAP_DETAIL } from "@/test/fixtures/roadmap-detail";
import { createTestQueryClient, renderWithProviders } from "@/test/renderWithProviders";
import { byTextContent } from "@/test/textContent";
import type { RoadmapDetail } from "@/types";

vi.mock("@/api/services", () => ({ getRoadmap: vi.fn() }));

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
