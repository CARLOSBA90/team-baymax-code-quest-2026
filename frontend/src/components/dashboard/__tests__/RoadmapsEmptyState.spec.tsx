import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Route, Routes, useLocation } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import { RoadmapsEmptyState } from "@/components/dashboard";
import { renderWithProviders } from "@/test/renderWithProviders";

function LocationProbe() {
  return <p data-testid="location">{useLocation().pathname}</p>;
}

function renderRoutes() {
  return renderWithProviders(
    <>
      <Routes>
        <Route path="/dashboard/roadmaps" element={<RoadmapsEmptyState />} />
        <Route path="/dashboard/roadmaps/new" element={<p>Cuestionario</p>} />
      </Routes>
      <LocationProbe />
    </>,
    { route: "/dashboard/roadmaps" },
  );
}

describe("RoadmapsEmptyState", () => {
  it("muestra el h2 y el párrafo explicativo", () => {
    renderWithProviders(<RoadmapsEmptyState />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Aún no tienes rutas" }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        "Responde un cuestionario corto para que armemos tu primera ruta de aprendizaje personalizada.",
      ),
    ).toBeInTheDocument();
  });

  it("renderiza la ilustración como decorativa, no accesible por rol", () => {
    const { container } = renderWithProviders(<RoadmapsEmptyState />);

    const illustration = container.querySelector("svg[aria-hidden='true']");
    expect(illustration).toBeInTheDocument();
    expect(screen.queryByRole("img")).not.toBeInTheDocument();
  });

  it("muestra un único CTA accesible, real y sin deshabilitar", () => {
    renderWithProviders(<RoadmapsEmptyState />);

    const cta = screen.getByRole("button", { name: "Crear mi primera ruta" });
    expect(cta).toBeInTheDocument();
    expect(cta).toHaveAttribute("type", "button");
    expect(cta).not.toBeDisabled();
    expect(cta).not.toHaveAttribute("aria-disabled");
    expect(screen.getAllByRole("button")).toHaveLength(1);
  });

  it("el click del CTA navega a /dashboard/roadmaps/new sin errores", async () => {
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderRoutes();

    await userEvent.setup().click(screen.getByRole("button", { name: "Crear mi primera ruta" }));

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/roadmaps/new");
    expect(screen.getByText("Cuestionario")).toBeInTheDocument();
    expect(consoleErrorSpy).not.toHaveBeenCalled();
  });

  it("el CTA es operable con Enter", async () => {
    renderRoutes();
    const user = userEvent.setup();

    screen.getByRole("button", { name: "Crear mi primera ruta" }).focus();
    await user.keyboard("{Enter}");

    expect(screen.getByTestId("location")).toHaveTextContent("/dashboard/roadmaps/new");
  });

  it("muestra las 3 tarjetas de paso con su copy, en orden", () => {
    renderWithProviders(<RoadmapsEmptyState />);

    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("01");
    expect(items[0]).toHaveTextContent("Cuéntanos qué te interesa");
    expect(items[1]).toHaveTextContent("02");
    expect(items[1]).toHaveTextContent("Evalúa tu nivel actual");
    expect(items[2]).toHaveTextContent("03");
    expect(items[2]).toHaveTextContent("Recibe tu ruta y avanza");
  });

  it("apila los pasos en una columna en móvil y los pone en 3 columnas desde sm", () => {
    renderWithProviders(<RoadmapsEmptyState />);

    const list = screen.getByRole("list");
    expect(list).toHaveClass("grid-cols-1", "sm:grid-cols-3");
    expect(list).not.toHaveClass("grid-cols-3");
  });

  it("no aplica la clase .nebula a ningún elemento", () => {
    const { container } = renderWithProviders(<RoadmapsEmptyState />);
    expect(container.querySelector(".nebula")).toBeNull();
  });
});
