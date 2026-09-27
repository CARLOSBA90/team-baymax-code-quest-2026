import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PausedBanner, type PausedBannerProps } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const DESCRIPTION_ID = "paused-description";
const HEADING_ID = "paused-heading";

function renderBanner(props: Partial<PausedBannerProps> = {}) {
  const onResume = vi.fn();
  const { container } = renderWithProviders(
    <PausedBanner
      pausedAt="2026-09-03T12:00:00.000Z"
      descriptionId={DESCRIPTION_ID}
      headingId={HEADING_ID}
      onResume={onResume}
      resuming={false}
      {...props}
    />,
  );
  return { onResume, container };
}

describe("PausedBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("es una región con el h2 «Esta ruta está en pausa»", () => {
    renderBanner();

    const heading = screen.getByRole("heading", { level: 2, name: "Esta ruta está en pausa" });
    expect(heading).toHaveClass("text-status-paused-text");
    expect(screen.getByRole("region", { name: "Esta ruta está en pausa" })).toBeInTheDocument();
  });

  it("explica desde cuándo está pausada en el párrafo con el id de la descripción", () => {
    renderBanner();

    const description = screen.getByText(
      "La pausaste el 3 de septiembre. Mientras esté pausada no se registra tu avance.",
    );
    expect(description).toHaveAttribute("id", DESCRIPTION_ID);
  });

  it("añade el año si la pausa es de otro año", () => {
    renderBanner({ pausedAt: "2025-09-03T12:00:00.000Z" });

    expect(
      screen.getByText(
        "La pausaste el 3 de septiembre de 2025. Mientras esté pausada no se registra tu avance.",
      ),
    ).toBeInTheDocument();
  });

  it("sin fecha de pausa válida solo muestra la segunda frase", () => {
    renderBanner({ pausedAt: null });

    const description = screen.getByText("Mientras esté pausada no se registra tu avance.");
    expect(description).toHaveAttribute("id", DESCRIPTION_ID);
    expect(screen.queryByText(/La pausaste el/)).not.toBeInTheDocument();
  });

  it("el h2 lleva el headingId recibido y tabIndex=-1 como destino de foco", () => {
    renderBanner();

    const heading = screen.getByRole("heading", { level: 2, name: "Esta ruta está en pausa" });
    expect(heading).toHaveAttribute("id", HEADING_ID);
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(heading).toHaveClass("outline-none");
    expect(screen.getByRole("region", { name: "Esta ruta está en pausa" })).toHaveAttribute(
      "aria-labelledby",
      HEADING_ID,
    );
  });

  it("una fecha inválida se trata como ausente", () => {
    renderBanner({ pausedAt: "no-es-fecha" });

    expect(screen.getByText("Mientras esté pausada no se registra tu avance.")).toBeInTheDocument();
  });

  it("«Reanudar ruta» está habilitado y el clic llama a onResume una vez", () => {
    const { onResume } = renderBanner();

    const button = screen.getByRole("button", { name: "Reanudar ruta" });
    expect(button).toBeEnabled();
    expect(button).not.toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onResume).toHaveBeenCalledTimes(1);
  });

  it("mientras reanuda: deshabilitado con «Reanudando…» y el clic no llama a onResume", () => {
    const { onResume } = renderBanner({ resuming: true });

    expect(screen.queryByRole("button", { name: "Reanudar ruta" })).not.toBeInTheDocument();
    const button = screen.getByRole("button", { name: "Reanudando…" });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute("aria-busy", "true");
    fireEvent.click(button);
    expect(onResume).not.toHaveBeenCalled();
    expect(button).toHaveClass("h-12", "w-full", "ml-auto", "sm:w-fit", "sm:px-6");
  });

  it("no es una alerta y los iconos son decorativos", () => {
    const { container } = renderBanner();

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  describe("móvil (base) / tablet (sm:)", () => {
    it("la sección usa padding compacto en móvil y el de slice 2 desde sm:", () => {
      renderBanner();

      const region = screen.getByRole("region", { name: "Esta ruta está en pausa" });
      expect(region).toHaveClass("p-4", "sm:px-5", "sm:py-4.5");
      for (const cls of ["px-5", "py-4.5"]) expect(region).not.toHaveClass(cls);
    });

    it("«Reanudar ruta» mide 48px, ocupa el ancho completo en móvil y se ajusta desde sm:", () => {
      renderBanner();

      const button = screen.getByRole("button", { name: "Reanudar ruta" });
      expect(button).toHaveClass("h-12", "w-full", "ml-auto", "sm:w-fit", "sm:px-6");
      for (const cls of ["w-fit", "px-6"]) expect(button).not.toHaveClass(cls);
    });
  });
});
