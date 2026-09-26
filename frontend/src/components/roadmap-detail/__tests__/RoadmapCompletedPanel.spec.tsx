import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapCompletedPanel } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

describe("RoadmapCompletedPanel", () => {
  it("es una región con el h2 «Completaste la ruta» y el resumen de pasos y horas", () => {
    renderWithProviders(<RoadmapCompletedPanel total={5} totalMinutes={4620} />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Completaste la ruta" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "Completaste la ruta" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "5 de 5 pasos · 77 h de estudio. Ya puedes crear otra ruta para seguir avanzando.",
      ),
    ).toBeInTheDocument();
  });

  it("enlaza a crear otra ruta y a Mis Rutas", () => {
    renderWithProviders(<RoadmapCompletedPanel total={5} totalMinutes={4620} />);

    expect(screen.getByRole("link", { name: "Crear otra ruta" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps/new",
    );
    expect(screen.getByRole("link", { name: "Volver a Mis Rutas" })).toHaveAttribute(
      "href",
      "/dashboard/roadmaps",
    );
  });

  it.each(["Crear otra ruta", "Volver a Mis Rutas"])(
    "«%s» ocupa el ancho completo en móvil y se ajusta desde sm:",
    (name) => {
      renderWithProviders(<RoadmapCompletedPanel total={5} totalMinutes={4620} />);

      const link = screen.getByRole("link", { name });
      expect(link).toHaveClass("h-11", "w-full", "px-5", "sm:w-fit");
      expect(link).not.toHaveClass("w-fit");
    },
  );

  it("usa la superficie Nebula en su variante verde", () => {
    renderWithProviders(<RoadmapCompletedPanel total={5} totalMinutes={4620} />);

    expect(screen.getByRole("region", { name: "Completaste la ruta" })).toHaveClass(
      "empty-state-surface",
      "empty-state-surface--success",
    );
  });

  it("la ilustración y los iconos son decorativos", () => {
    const { container } = renderWithProviders(
      <RoadmapCompletedPanel total={5} totalMinutes={4620} />,
    );

    expect(screen.queryByRole("img")).not.toBeInTheDocument();
    const svgs = container.querySelectorAll("svg");
    expect(svgs.length).toBeGreaterThanOrEqual(2);
    for (const svg of svgs) expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(container.querySelector('[data-testid="completed-illustration"]')).toHaveClass(
      "hidden",
      "sm:block",
    );
  });
});
