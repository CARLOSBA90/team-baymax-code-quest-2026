import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AssessmentWizard } from "@/components/assessment";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { AssessmentQuestion, SkillCategory } from "@/types";

const CTA = "Descubrir mi ruta de aprendizaje";

function makeQuestion(
  order: number,
  optionCount: number,
  category: SkillCategory,
  overrides: Partial<AssessmentQuestion> = {},
): AssessmentQuestion {
  return {
    id: `q${order}`,
    text: `Pregunta número ${order}`,
    category,
    order,
    options: Array.from({ length: optionCount }, (_, index) => ({
      id: `q${order}-o${index + 1}`,
      text: `P${order} opción ${index + 1}`,
      order: index + 1,
    })),
    ...overrides,
  };
}

// Array desordenado a propósito: el wizard debe ordenar por `order`.
const QUESTIONS: AssessmentQuestion[] = [
  makeQuestion(2, 4, "BACKEND", { sectionLabel: "Intereses" }),
  makeQuestion(1, 4, "WEB_FUNDAMENTALS"),
  makeQuestion(3, 3, "DEVOPS"),
];

function renderWizard(questions = QUESTIONS) {
  const onSubmit = vi.fn();
  const utils = renderWithProviders(<AssessmentWizard questions={questions} onSubmit={onSubmit} />);
  return { ...utils, onSubmit, user: userEvent.setup() };
}

function heading(order: number) {
  return screen.getByRole("heading", { level: 2, name: `Pregunta número ${order}` });
}

describe("AssessmentWizard", () => {
  it("con questions=[] no renderiza nada", () => {
    const { container } = renderWizard([]);
    expect(container).toBeEmptyDOMElement();
  });

  it("estado inicial: solo se ve la pregunta 1 (por order) y su progreso", () => {
    renderWizard();

    expect(heading(1)).toBeInTheDocument();
    expect(screen.getAllByRole("heading", { level: 2 })).toHaveLength(1);
    expect(screen.getByText("Pregunta 1 de 3")).toBeInTheDocument();
    expect(screen.getAllByRole("radio")).toHaveLength(4);
    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).not.toBeChecked();
    }
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("no roba el foco en el primer render", () => {
    renderWizard();
    expect(document.activeElement).toBe(document.body);
  });

  it("la sección se deriva de la categoría o usa sectionLabel", async () => {
    const { user } = renderWizard();

    expect(screen.getByText("Fundamentos")).toBeInTheDocument();

    await user.click(screen.getByRole("radio", { name: "P1 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByText("Intereses")).toBeInTheDocument();
    expect(screen.queryByText("Backend")).not.toBeInTheDocument();
  });

  it("habilita Siguiente al seleccionar y avanza a la pregunta 2", async () => {
    const { user } = renderWizard();

    await user.click(screen.getByText("P1 opción 2"));
    expect(screen.getByRole("radio", { name: "P1 opción 2" })).toBeChecked();
    const next = screen.getByRole("button", { name: "Siguiente" });
    expect(next).toBeEnabled();

    await user.click(next);

    expect(heading(2)).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Pregunta número 1" })).not.toBeInTheDocument();
    expect(screen.getByText("Pregunta 2 de 3")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeDisabled();
  });

  it("Siguiente deshabilitado no avanza", async () => {
    const { user } = renderWizard();

    await user.click(screen.getByRole("radio", { name: "P1 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(heading(2)).toBeInTheDocument();
  });

  it("mueve el foco al h2 tras Siguiente y Anterior", async () => {
    const { user } = renderWizard();

    await user.click(screen.getByRole("radio", { name: "P1 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(heading(2)).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(heading(1)).toHaveFocus();
    expect(document.activeElement).not.toBe(document.body);
  });

  it("retrocede sin responder la actual y conserva las respuestas en ambos sentidos", async () => {
    const { user } = renderWizard();

    await user.click(screen.getByRole("radio", { name: "P1 opción 2" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("radio", { name: "P2 opción 3" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    // Pregunta 3 sin responder: Anterior sigue disponible.
    expect(heading(3)).toBeInTheDocument();
    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(heading(2)).toBeInTheDocument();
    expect(screen.getByRole("radio", { name: "P2 opción 3" })).toBeChecked();

    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(screen.getByRole("radio", { name: "P1 opción 2" })).toBeChecked();
    expect(screen.getByRole("button", { name: "Siguiente" })).toBeEnabled();

    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByRole("radio", { name: "P2 opción 3" })).toBeChecked();
  });

  it("muestra los segmentos de progreso según el estado de cada pregunta", async () => {
    const { user, container } = renderWizard();
    const states = () =>
      Array.from(container.querySelectorAll("ol > li")).map((li) => li.getAttribute("data-state"));

    expect(states()).toEqual(["current", "pending", "pending"]);

    await user.click(screen.getByRole("radio", { name: "P1 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("radio", { name: "P2 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(states()).toEqual(["answered", "answered", "current"]);

    await user.click(screen.getByRole("radio", { name: "P3 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Anterior" }));

    expect(states()).toEqual(["answered", "current", "answered"]);
  });

  it("la última pregunta (3 opciones) muestra el CTA final en lugar de Siguiente", async () => {
    const { user } = renderWizard();

    await user.click(screen.getByRole("radio", { name: "P1 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("radio", { name: "P2 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    const group = screen.getByRole("group", { name: "Pregunta número 3" });
    expect(within(group).getAllByRole("radio")).toHaveLength(3);
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: CTA })).toBeDisabled();
  });

  it("onSubmit recibe una respuesta por pregunta en orden, incluida una respuesta cambiada", async () => {
    const { user, onSubmit } = renderWizard();

    await user.click(screen.getByRole("radio", { name: "P1 opción 1" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("radio", { name: "P2 opción 2" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));
    await user.click(screen.getByRole("radio", { name: "P3 opción 3" }));

    // Vuelve a la 2, cambia la respuesta y avanza de nuevo hasta la última.
    await user.click(screen.getByRole("button", { name: "Anterior" }));
    await user.click(screen.getByRole("radio", { name: "P2 opción 4" }));
    await user.click(screen.getByRole("button", { name: "Siguiente" }));

    expect(screen.getByRole("radio", { name: "P3 opción 3" })).toBeChecked();
    await user.click(screen.getByRole("button", { name: CTA }));

    expect(onSubmit).toHaveBeenCalledTimes(1);
    expect(onSubmit).toHaveBeenCalledWith([
      { questionId: "q1", optionId: "q1-o1" },
      { questionId: "q2", optionId: "q2-o4" },
      { questionId: "q3", optionId: "q3-o3" },
    ]);
  });

  it("con una sola pregunta, Anterior está deshabilitado y el principal es el CTA final", () => {
    renderWizard([makeQuestion(1, 2, "FRONTEND")]);

    expect(screen.getByText("Pregunta 1 de 1")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Anterior" })).toBeDisabled();
    expect(screen.getByRole("button", { name: CTA })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Siguiente" })).not.toBeInTheDocument();
  });
});
