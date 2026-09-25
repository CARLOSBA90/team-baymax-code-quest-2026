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
});
