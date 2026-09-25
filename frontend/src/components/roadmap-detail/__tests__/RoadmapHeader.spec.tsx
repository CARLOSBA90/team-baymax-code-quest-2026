import { screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { RoadmapHeader, type RoadmapHeaderProps } from "@/components/roadmap-detail";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { RoadmapStatus } from "@/types";

const NOW = new Date("2026-09-25T12:00:00Z");
const TWO_HOURS_AGO = new Date(NOW.getTime() - 2 * 60 * 60 * 1000).toISOString();

const BASE_PROPS: RoadmapHeaderProps = {
  name: "Mi ruta de backend",
  summary: "Aprende a construir APIs con Go.",
  status: "IN_PROGRESS",
  lastActivity: TWO_HOURS_AGO,
  headingId: "roadmap-heading",
};

function renderHeader(props: Partial<RoadmapHeaderProps> = {}) {
  return renderWithProviders(<RoadmapHeader {...BASE_PROPS} {...props} />);
}

describe("RoadmapHeader", () => {
  beforeEach(() => {
    // Solo Date: los timers reales siguen, así que Testing Library no necesita el stub de `jest`.
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(NOW);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("muestra el nombre como h1 con el id recibido", () => {
    renderHeader();

    const heading = screen.getByRole("heading", { level: 1, name: BASE_PROPS.name });
    expect(heading).toHaveAttribute("id", "roadmap-heading");
    expect(heading.closest("header")).toBeInTheDocument();
  });

  it("muestra el resumen cuando existe", () => {
    renderHeader();

    expect(screen.getByText("Aprende a construir APIs con Go.")).toBeInTheDocument();
  });

  it.each([
    ["vacío", ""],
    ["null", null],
  ])("sin resumen (%s) no pinta un párrafo vacío", (_label, summary) => {
    const { container } = renderHeader({ summary });

    const paragraphs = Array.from(container.querySelectorAll("p"));
    expect(paragraphs.every((p) => (p.textContent ?? "").trim() !== "")).toBe(true);
    expect(paragraphs).toHaveLength(1);
  });

  it.each<[RoadmapStatus, string]>([
    ["IN_PROGRESS", "Empezada"],
    ["NOT_STARTED", "Sin empezar"],
    ["PAUSED", "En pausa"],
    ["COMPLETED", "Completada"],
  ])("el badge de %s dice «%s»", (status, label) => {
    renderHeader({ status });

    expect(screen.getByText(label)).toBeInTheDocument();
    expect(screen.queryByText("En curso")).not.toBeInTheDocument();
  });

  it("muestra la última actividad en forma relativa larga", () => {
    renderHeader();

    expect(screen.getByText("Última actividad: hace 2 horas")).toBeInTheDocument();
  });

  it("usa la misma regla con la ruta completada (fecha corta desde 7 días)", () => {
    renderHeader({ status: "COMPLETED", lastActivity: "2026-09-18T12:00:00Z" });

    expect(screen.getByText("Última actividad: 18 sept")).toBeInTheDocument();
  });

  it("añade el año si la actividad es de otro año", () => {
    renderHeader({ lastActivity: "2025-08-12T12:00:00Z" });

    expect(screen.getByText("Última actividad: 12 ago 2025")).toBeInTheDocument();
  });

  it("omite la última actividad si la fecha no es válida", () => {
    renderHeader({ lastActivity: "x" });

    expect(screen.queryByText(/Última actividad/)).not.toBeInTheDocument();
  });

  it("no tiene botones (sin menú ⋯)", () => {
    renderHeader();

    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });
});
