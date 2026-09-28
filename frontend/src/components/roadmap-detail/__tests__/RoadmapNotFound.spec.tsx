import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapNotFound } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RoadmapNotFound", () => {
  it("muestra el h1 «No encontramos esta ruta» y un enlace a Mis Rutas", () => {
    renderWithProviders(<RoadmapNotFound />);

    expect(
      screen.getByRole("heading", { level: 1, name: "No encontramos esta ruta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Volver a Mis Rutas" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps",
    );
  });

  it("el enlace se ajusta a su contenido (w-fit explícito)", () => {
    renderWithProviders(<RoadmapNotFound />);

    expect(screen.getByRole("link", { name: "Volver a Mis Rutas" })).toHaveClass(
      "w-fit",
      "h-12",
      "px-6",
    );
  });

  it("no ofrece «Reintentar»", () => {
    renderWithProviders(<RoadmapNotFound />);

    expect(screen.queryByRole("button", { name: "Reintentar" })).not.toBeInTheDocument();
  });
});
