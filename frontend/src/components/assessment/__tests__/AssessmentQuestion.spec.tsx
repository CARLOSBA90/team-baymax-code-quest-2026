import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createRef, useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { AssessmentQuestion } from "@/components/assessment";
import { DEFAULT_ASSESSMENT_HELPER_TEXT } from "@/lib";
import { renderWithProviders } from "@/test/renderWithProviders";
import type { AssessmentQuestion as AssessmentQuestionData } from "@/types";

function makeQuestion(
  optionOrders: number[],
  overrides: Partial<AssessmentQuestionData> = {},
): AssessmentQuestionData {
  return {
    id: "q1",
    text: "¿Qué quieres construir?",
    category: "FRONTEND",
    order: 1,
    options: optionOrders.map((order) => ({ id: `o${order}`, text: `Opción ${order}`, order })),
    ...overrides,
  };
}

function renderQuestion(question: AssessmentQuestionData, selectedOptionId?: string) {
  return renderWithProviders(
    <>
      <p id="progress-label">Pregunta 1 de 3</p>
      <AssessmentQuestion
        question={question}
        selectedOptionId={selectedOptionId}
        onSelect={vi.fn()}
        titleRef={createRef<HTMLHeadingElement>()}
        describedById="progress-label"
      />
    </>,
  );
}

function StatefulQuestion({ question }: { question: AssessmentQuestionData }) {
  const [selected, setSelected] = useState<string>();
  return (
    <AssessmentQuestion
      question={question}
      selectedOptionId={selected}
      onSelect={setSelected}
      titleRef={createRef<HTMLHeadingElement>()}
      describedById="progress-label"
    />
  );
}

describe("AssessmentQuestion", () => {
  it("expone un group con nombre igual al texto de la pregunta", () => {
    renderQuestion(makeQuestion([1, 2, 3, 4]));

    const group = screen.getByRole("group", { name: "¿Qué quieres construir?" });
    expect(within(group).getAllByRole("radio")).toHaveLength(4);
  });

  it("el título es un h2 enfocable por programa y descrito por el progreso", () => {
    const titleRef = createRef<HTMLHeadingElement>();
    renderWithProviders(
      <>
        <p id="progress-label">Pregunta 1 de 3</p>
        <AssessmentQuestion
          question={makeQuestion([1, 2])}
          selectedOptionId={undefined}
          onSelect={vi.fn()}
          titleRef={titleRef}
          describedById="progress-label"
        />
      </>,
    );

    const heading = screen.getByRole("heading", { level: 2, name: "¿Qué quieres construir?" });
    expect(heading).toHaveAttribute("tabindex", "-1");
    expect(heading).toHaveAccessibleDescription("Pregunta 1 de 3");
    expect(titleRef.current).toBe(heading);
  });

  it("sin helperText muestra el texto de ayuda por defecto asociado al grupo", () => {
    renderQuestion(makeQuestion([1, 2]));

    expect(screen.getByText(DEFAULT_ASSESSMENT_HELPER_TEXT)).toBeInTheDocument();
    expect(screen.getByRole("group")).toHaveAccessibleDescription(DEFAULT_ASSESSMENT_HELPER_TEXT);
  });

  it("con helperText lo muestra en lugar del texto por defecto", () => {
    renderQuestion(makeQuestion([1, 2], { helperText: "Elige la que mejor te describa." }));

    expect(screen.getByText("Elige la que mejor te describa.")).toBeInTheDocument();
    expect(screen.queryByText(DEFAULT_ASSESSMENT_HELPER_TEXT)).not.toBeInTheDocument();
    expect(screen.getByRole("group")).toHaveAccessibleDescription(
      "Elige la que mejor te describa.",
    );
  });

  it("con helperText vacío no deja un elemento de ayuda vacío", () => {
    renderQuestion(makeQuestion([1, 2], { helperText: "" }));

    const group = screen.getByRole("group");
    expect(group).not.toHaveAttribute("aria-describedby");
    expect(group.querySelector("p")).toBeNull();
    expect(within(group).getAllByRole("radio")).toHaveLength(2);
  });

  it("admite un número impar de opciones sin perder ninguna", () => {
    renderQuestion(makeQuestion([1, 2, 3]));

    const radios = screen.getAllByRole("radio");
    expect(radios).toHaveLength(3);
    for (const order of [1, 2, 3]) {
      expect(screen.getByRole("radio", { name: `Opción ${order}` })).toBeInTheDocument();
    }
  });

  it("ordena las opciones por order sin depender del orden del array", () => {
    renderQuestion(makeQuestion([3, 1, 2]));

    expect(screen.getAllByRole("radio").map((radio) => radio.getAttribute("value"))).toEqual([
      "o1",
      "o2",
      "o3",
    ]);
  });

  it("todos los radios comparten el name de la pregunta", () => {
    renderQuestion(makeQuestion([1, 2, 3]));

    for (const radio of screen.getAllByRole("radio")) {
      expect(radio).toHaveAttribute("name", "question-q1");
    }
  });

  it("marca como checked la opción seleccionada", () => {
    renderQuestion(makeQuestion([1, 2, 3]), "o2");

    expect(screen.getByRole("radio", { name: "Opción 2" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "Opción 1" })).not.toBeChecked();
    expect(screen.getByRole("radio", { name: "Opción 3" })).not.toBeChecked();
  });

  it("la flecha abajo mueve el foco y la selección al siguiente radio", async () => {
    const user = userEvent.setup();
    renderWithProviders(<StatefulQuestion question={makeQuestion([1, 2, 3])} />);

    await user.click(screen.getByRole("radio", { name: "Opción 1" }));
    expect(screen.getByRole("radio", { name: "Opción 1" })).toBeChecked();

    await user.keyboard("{ArrowDown}");

    const second = screen.getByRole("radio", { name: "Opción 2" });
    expect(second).toHaveFocus();
    expect(second).toBeChecked();
    expect(screen.getByRole("radio", { name: "Opción 1" })).not.toBeChecked();
  });
});
