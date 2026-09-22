import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapsPage } from "@/pages";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RoadmapsPage", () => {
  it("muestra el encabezado Mis Rutas y el subtítulo", () => {
    renderWithProviders(<RoadmapsPage />);
    expect(screen.getByRole("heading", { level: 1, name: "Mis Rutas" })).toBeInTheDocument();
    expect(
      screen.getByText("Aquí aparecerán las rutas de aprendizaje que crees."),
    ).toBeInTheDocument();
  });

  it("no renderiza main propio ni la clase .nebula", () => {
    const { container } = renderWithProviders(<RoadmapsPage />);
    expect(screen.queryByRole("main")).not.toBeInTheDocument();
    expect(container.querySelector(".nebula")).toBeNull();
  });

  it("muestra el CTA del estado vacío y ningún dato de usuario/logout", () => {
    renderWithProviders(<RoadmapsPage />);
    expect(screen.getByRole("button", { name: "Crear mi primera ruta" })).toBeInTheDocument();
    expect(screen.queryByText(/@/)).not.toBeInTheDocument();
  });
});
