import { screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { AssessmentProgress, type AssessmentProgressSegmentState } from "@/components/assessment";
import { renderWithProviders } from "@/test/renderWithProviders";

function renderProgress({
  current = 1,
  total = 7,
  sectionLabel = "Fundamentos",
  segments,
}: {
  current?: number;
  total?: number;
  sectionLabel?: string;
  segments: AssessmentProgressSegmentState[];
}) {
  return renderWithProviders(
    <AssessmentProgress
      current={current}
      total={total}
      sectionLabel={sectionLabel}
      labelId="progress-label"
      segments={segments}
    />,
  );
}

function getSegmentStates(container: HTMLElement) {
  return Array.from(container.querySelectorAll("ol > li")).map((li) =>
    li.getAttribute("data-state"),
  );
}

describe("AssessmentProgress", () => {
  it('muestra "Pregunta N de M" con el id recibido', () => {
    renderProgress({
      current: 2,
      segments: ["answered", "current", "pending", "pending", "pending", "pending", "pending"],
    });

    const label = screen.getByText("Pregunta 2 de 7");
    expect(label).toHaveAttribute("id", "progress-label");
    expect(label).toHaveClass("uppercase");
  });

  it("progreso inicial: 7 segmentos, el 1º actual y el resto pendientes", () => {
    const { container } = renderProgress({
      segments: ["current", "pending", "pending", "pending", "pending", "pending", "pending"],
    });

    expect(screen.getByText("Pregunta 1 de 7")).toBeInTheDocument();
    expect(getSegmentStates(container)).toEqual([
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("progreso tras avanzar: 1 y 2 respondidos, 3 actual y 4–7 pendientes", () => {
    const { container } = renderProgress({
      current: 3,
      segments: ["answered", "answered", "current", "pending", "pending", "pending", "pending"],
    });

    expect(screen.getByText("Pregunta 3 de 7")).toBeInTheDocument();
    expect(getSegmentStates(container)).toEqual([
      "answered",
      "answered",
      "current",
      "pending",
      "pending",
      "pending",
      "pending",
    ]);
  });

  it("progreso al volver atrás: 2 actual con 1 y 3 respondidos", () => {
    const { container } = renderProgress({
      current: 2,
      segments: ["answered", "current", "answered", "pending", "pending", "pending", "pending"],
    });

    expect(screen.getByText("Pregunta 2 de 7")).toBeInTheDocument();
    const states = getSegmentStates(container);
    expect(states[0]).toBe("answered");
    expect(states[1]).toBe("current");
    expect(states[2]).toBe("answered");
  });

  it("total variable: 4 segmentos", () => {
    const { container } = renderProgress({
      total: 4,
      segments: ["current", "pending", "pending", "pending"],
    });

    expect(screen.getByText("Pregunta 1 de 4")).toBeInTheDocument();
    expect(container.querySelectorAll("ol > li")).toHaveLength(4);
  });

  it("la barra es decorativa (aria-hidden) y no aparece como lista accesible", () => {
    const { container } = renderProgress({ segments: ["current", "pending"] });

    expect(container.querySelector("ol")).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("aplica un color distinto a cada estado", () => {
    const { container } = renderProgress({ segments: ["answered", "current", "pending"] });
    const [answered, current, pending] = Array.from(container.querySelectorAll("ol > li"));

    expect(answered).toHaveClass("bg-accent-hover");
    expect(current).toHaveClass("bg-accent-soft");
    expect(pending).toHaveClass("bg-border-ghost");
  });

  it("muestra la etiqueta de sección junto al progreso", () => {
    renderProgress({ sectionLabel: "Intereses", segments: ["current"] });

    const label = screen.getByText("Intereses");
    expect(label.parentElement).toBe(screen.getByText("Pregunta 1 de 7").parentElement);
  });

  it("sin etiqueta de sección no renderiza un elemento vacío", () => {
    const { container } = renderProgress({
      sectionLabel: "",
      segments: ["current", "pending"],
    });

    const row = screen.getByText("Pregunta 1 de 7").parentElement;
    expect(row?.children).toHaveLength(1);
    expect(container.querySelectorAll("ol > li")).toHaveLength(2);
  });
});
