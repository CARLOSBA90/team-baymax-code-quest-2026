import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { RoadmapMonogram } from "@/components/roadmaps";

describe("RoadmapMonogram", () => {
  it("usa el monograma y el acento de la ruta, oculto a tecnologías de asistencia", () => {
    const { container } = render(
      <RoadmapMonogram
        roadmap={{ name: "Frontend moderno con React", monogram: "FE", accent: "violet" }}
      />,
    );

    const monogram = container.firstElementChild;
    expect(monogram).toHaveTextContent("FE");
    expect(monogram).toHaveAttribute("aria-hidden", "true");
    expect(monogram).toHaveClass("text-mono-violet");
  });

  it("sin monograma ni acento deriva las iniciales y usa el acento neutro", () => {
    const { container } = render(
      <RoadmapMonogram roadmap={{ name: "Apps móviles con Flutter" }} />,
    );

    const monogram = container.firstElementChild;
    expect(monogram?.textContent).toMatch(/^[A-ZÁÉÍÓÚÑ]{1,2}$/);
    expect(monogram).toHaveAttribute("data-accent", "neutral");
    expect(monogram).toHaveClass("text-text-secondary");
  });
});
