import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapDetailSkeleton } from "@/components/roadmap-detail";

describe("RoadmapDetailSkeleton", () => {
  it("marca el contenedor como ocupado y anuncia «Cargando la ruta»", () => {
    const { container } = render(<RoadmapDetailSkeleton />);

    expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
    expect(screen.getByRole("status")).toHaveTextContent("Cargando la ruta");
  });

  it("oculta los bloques decorativos a las tecnologías de apoyo y no tiene h1", () => {
    render(<RoadmapDetailSkeleton />);

    expect(screen.getByTestId("roadmap-detail-skeleton-blocks")).toHaveAttribute(
      "aria-hidden",
      "true",
    );
    expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
  });

  it("usa la columna de detalle de 920px con el mismo gap que la vista", () => {
    const { container } = render(<RoadmapDetailSkeleton />);

    expect(container.firstElementChild).toHaveClass("w-full", "max-w-detail");
    expect(screen.getByTestId("roadmap-detail-skeleton-blocks")).toHaveClass(
      "flex",
      "flex-col",
      "gap-5.5",
    );
  });

  it("reproduce la geometría de cabecera: enlace 96×16, título 280×30, resumen 420×16, badge 90×26", () => {
    render(<RoadmapDetailSkeleton />);

    expect(screen.getByTestId("skeleton-back-link")).toHaveClass("h-4", "w-24");
    expect(screen.getByTestId("skeleton-title")).toHaveClass("h-7.5", "w-70");
    expect(screen.getByTestId("skeleton-summary")).toHaveClass("h-4", "w-105", "max-w-full");
    expect(screen.getByTestId("skeleton-badge")).toHaveClass("h-6.5", "w-22.5");
  });

  it("pinta la barra global de 8px a todo el ancho sin tarjeta y la tarjeta de 150px", () => {
    render(<RoadmapDetailSkeleton />);

    const bar = screen.getByTestId("skeleton-progress");
    expect(bar).toHaveClass("h-2", "w-full", "rounded-full");
    expect(bar.parentElement).not.toHaveClass("border");
    expect(screen.getByTestId("skeleton-next-step")).toHaveClass(
      "h-37.5",
      "w-full",
      "rounded-[18px]",
    );
  });

  it("pinta 5 filas de timeline de 112px con el hueco del riel", () => {
    render(<RoadmapDetailSkeleton />);

    const rows = screen.getAllByTestId("skeleton-timeline-row");
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row).toHaveClass("pl-9", "lg:pl-11");
      expect(row.firstElementChild).toHaveClass("h-28", "w-full");
    }
  });
});
