import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapsListSkeleton } from "@/components/roadmaps";

describe("RoadmapsListSkeleton", () => {
  it("anuncia la carga y marca el contenedor como ocupado", () => {
    render(<RoadmapsListSkeleton />);

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent("Cargando rutas…");
    expect(status.parentElement).toHaveAttribute("aria-busy", "true");
  });

  it("los bloques del placeholder son decorativos", () => {
    render(<RoadmapsListSkeleton />);

    expect(screen.getByTestId("roadmaps-skeleton-blocks")).toHaveAttribute("aria-hidden", "true");
  });
});
