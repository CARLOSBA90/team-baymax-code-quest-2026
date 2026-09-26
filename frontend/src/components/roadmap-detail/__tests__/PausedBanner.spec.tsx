import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { PausedBanner } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";

const DESCRIPTION_ID = "paused-description";
const HEADING_ID = "paused-heading";

describe("PausedBanner", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date("2026-09-25T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("es una región con el h2 «Esta ruta está en pausa»", () => {
    renderWithProviders(
      <PausedBanner
        pausedAt="2026-09-03T12:00:00.000Z"
        descriptionId={DESCRIPTION_ID}
        headingId={HEADING_ID}
      />,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "Esta ruta está en pausa" });
    expect(heading).toHaveClass("text-status-paused-text");
    expect(screen.getByRole("region", { name: "Esta ruta está en pausa" })).toBeInTheDocument();
  });

  it("explica desde cuándo está pausada en el párrafo con el id de la descripción", () => {
    renderWithProviders(
      <PausedBanner
        pausedAt="2026-09-03T12:00:00.000Z"
        descriptionId={DESCRIPTION_ID}
        headingId={HEADING_ID}
      />,
    );

    const description = screen.getByText(
      "La pausaste el 3 de septiembre. Mientras esté pausada no se registra tu avance.",
    );
    expect(description).toHaveAttribute("id", DESCRIPTION_ID);
  });

  it("añade el año si la pausa es de otro año", () => {
    renderWithProviders(
      <PausedBanner
        pausedAt="2025-09-03T12:00:00.000Z"
        descriptionId={DESCRIPTION_ID}
        headingId={HEADING_ID}
      />,
    );

    expect(
      screen.getByText(
        "La pausaste el 3 de septiembre de 2025. Mientras esté pausada no se registra tu avance.",
      ),
    ).toBeInTheDocument();
  });

  it("sin fecha de pausa válida solo muestra la segunda frase", () => {
    renderWithProviders(
      <PausedBanner pausedAt={null} descriptionId={DESCRIPTION_ID} headingId={HEADING_ID} />,
    );

    const description = screen.getByText("Mientras esté pausada no se registra tu avance.");
    expect(description).toHaveAttribute("id", DESCRIPTION_ID);
    expect(screen.queryByText(/La pausaste el/)).not.toBeInTheDocument();
  });

  it("el h2 lleva el headingId recibido y tabIndex=-1 como destino de foco", () => {
    renderWithProviders(
      <PausedBanner
        pausedAt="2026-09-03T12:00:00.000Z"
        descriptionId={DESCRIPTION_ID}
        headingId={HEADING_ID}
      />,
    );

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
    renderWithProviders(
      <PausedBanner pausedAt="no-es-fecha" descriptionId={DESCRIPTION_ID} headingId={HEADING_ID} />,
    );

    expect(screen.getByText("Mientras esté pausada no se registra tu avance.")).toBeInTheDocument();
  });

  it("«Reanudar ruta» está deshabilitado y el clic no hace nada", () => {
    renderWithProviders(
      <PausedBanner
        pausedAt="2026-09-03T12:00:00.000Z"
        descriptionId={DESCRIPTION_ID}
        headingId={HEADING_ID}
      />,
    );

    const button = screen.getByRole("button", { name: "Reanudar ruta" });
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(button).toBeDisabled();
  });

  it("no es una alerta y los iconos son decorativos", () => {
    const { container } = renderWithProviders(
      <PausedBanner
        pausedAt="2026-09-03T12:00:00.000Z"
        descriptionId={DESCRIPTION_ID}
        headingId={HEADING_ID}
      />,
    );

    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    const icons = container.querySelectorAll("svg");
    expect(icons.length).toBeGreaterThanOrEqual(2);
    for (const icon of icons) expect(icon).toHaveAttribute("aria-hidden", "true");
  });

  describe("móvil (base) / tablet (sm:)", () => {
    it("la sección usa padding compacto en móvil y el de slice 2 desde sm:", () => {
      renderWithProviders(
        <PausedBanner
          pausedAt="2026-09-03T12:00:00.000Z"
          descriptionId={DESCRIPTION_ID}
          headingId={HEADING_ID}
        />,
      );

      const region = screen.getByRole("region", { name: "Esta ruta está en pausa" });
      expect(region).toHaveClass("p-4", "sm:px-5", "sm:py-4.5");
      for (const cls of ["px-5", "py-4.5"]) expect(region).not.toHaveClass(cls);
    });

    it("«Reanudar ruta» mide 48px, ocupa el ancho completo en móvil y se ajusta desde sm:", () => {
      renderWithProviders(
        <PausedBanner
          pausedAt="2026-09-03T12:00:00.000Z"
          descriptionId={DESCRIPTION_ID}
          headingId={HEADING_ID}
        />,
      );

      const button = screen.getByRole("button", { name: "Reanudar ruta" });
      expect(button).toBeDisabled();
      expect(button).toHaveClass("h-12", "w-full", "ml-auto", "sm:w-fit", "sm:px-6");
      for (const cls of ["w-fit", "px-6"]) expect(button).not.toHaveClass(cls);
    });
  });
});
