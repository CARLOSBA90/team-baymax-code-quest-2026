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
    expect(screen.getByTestId("skeleton-title")).toHaveClass("h-6.5", "w-70", "sm:h-7.5");
    expect(screen.getByTestId("skeleton-summary")).toHaveClass("h-4", "w-105", "max-w-full");
    expect(screen.getByTestId("skeleton-badge")).toHaveClass("h-6.5", "w-22.5");
  });

  it("pinta la barra global de 8px a todo el ancho sin tarjeta y la tarjeta de 150px", () => {
    render(<RoadmapDetailSkeleton />);

    const bar = screen.getByTestId("skeleton-progress");
    expect(bar).toHaveClass("h-2", "w-full", "rounded-full");
    expect(bar.parentElement).not.toHaveClass("border");
    expect(screen.getByTestId("skeleton-next-step")).toHaveClass(
      "sm:h-37.5",
      "w-full",
      "rounded-[18px]",
    );
  });

  it("pinta 5 filas de timeline de 112px con el hueco del riel", () => {
    render(<RoadmapDetailSkeleton />);

    const rows = screen.getAllByTestId("skeleton-timeline-row");
    expect(rows).toHaveLength(5);
    for (const row of rows) {
      expect(row).toHaveClass("sm:pl-7", "lg:pl-11");
      expect(row.firstElementChild).toHaveClass("sm:h-28", "w-full");
    }
  });

  describe("móvil (base) / tablet (sm:)", () => {
    it("el título mide 26px en móvil y 30px desde sm:", () => {
      render(<RoadmapDetailSkeleton />);

      const title = screen.getByTestId("skeleton-title");
      expect(title).toHaveClass("h-6.5", "sm:h-7.5");
      expect(title).not.toHaveClass("h-7.5");
    });

    it("el bloque del resumen se oculta en móvil (el summary es sr-only) y se ve desde sm:", () => {
      render(<RoadmapDetailSkeleton />);

      expect(screen.getByTestId("skeleton-summary")).toHaveClass("hidden", "sm:block");
    });

    it("la tarjeta «Continúa aquí» es más alta en móvil (contenido apilado)", () => {
      render(<RoadmapDetailSkeleton />);

      const card = screen.getByTestId("skeleton-next-step");
      expect(card).toHaveClass("h-56", "sm:h-37.5");
      expect(card).not.toHaveClass("h-37.5");
    });

    it("las filas no reservan hueco de riel en móvil y son más altas", () => {
      render(<RoadmapDetailSkeleton />);

      for (const row of screen.getAllByTestId("skeleton-timeline-row")) {
        expect(row).toHaveClass("sm:pl-7", "lg:pl-11");
        for (const cls of ["pl-9", "pl-7"]) expect(row).not.toHaveClass(cls);
        const block = row.firstElementChild;
        expect(block).toHaveClass("h-40", "sm:h-28", "w-full");
        expect(block).not.toHaveClass("h-28");
      }
    });

    it("conserva el estado accesible y los testids", () => {
      const { container } = render(<RoadmapDetailSkeleton />);

      expect(container.firstElementChild).toHaveAttribute("aria-busy", "true");
      expect(screen.getByRole("status")).toHaveTextContent("Cargando la ruta");
      expect(screen.queryByRole("heading", { level: 1 })).not.toBeInTheDocument();
      for (const id of [
        "roadmap-detail-skeleton-blocks",
        "skeleton-back-link",
        "skeleton-title",
        "skeleton-summary",
        "skeleton-badge",
        "skeleton-progress",
        "skeleton-next-step",
      ]) {
        expect(screen.getByTestId(id)).toBeInTheDocument();
      }
      expect(screen.getAllByTestId("skeleton-timeline-row")).toHaveLength(5);
    });
  });
});
