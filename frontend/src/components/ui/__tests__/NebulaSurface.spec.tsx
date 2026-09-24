import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { NebulaSurface } from "@/components/ui";

describe("NebulaSurface", () => {
  it("renderiza sus hijos dentro de la superficie", () => {
    render(
      <NebulaSurface>
        <p>Contenido</p>
      </NebulaSurface>,
    );

    expect(screen.getByText("Contenido").parentElement).toHaveClass("empty-state-surface");
  });

  // jsdom no calcula layout: se fijan las clases que evitan el recorte en móvil. La superficie
  // tiene overflow-hidden (min-height automático = 0), así que con flex-1 se encogía al alto
  // libre y el contenido centrado se cortaba por arriba y por abajo.
  it("crece para rellenar el hueco pero nunca se encoge por debajo de su contenido", () => {
    render(
      <NebulaSurface>
        <p>Contenido</p>
      </NebulaSurface>,
    );

    const surface = screen.getByText("Contenido").parentElement;
    expect(surface).toHaveClass("grow", "shrink-0");
    expect(surface).not.toHaveClass("flex-1");
  });

  it("usa padding compacto en móvil y el amplio desde md", () => {
    render(
      <NebulaSurface>
        <p>Contenido</p>
      </NebulaSurface>,
    );

    expect(screen.getByText("Contenido").parentElement).toHaveClass("px-5", "py-8", "md:p-12");
  });
});
