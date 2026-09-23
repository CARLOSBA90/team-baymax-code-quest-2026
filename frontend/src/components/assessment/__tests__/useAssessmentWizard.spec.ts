import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import {
  type AssessmentWizardState,
  assessmentWizardReducer,
  buildAssessmentAnswers,
  initialAssessmentWizardState,
  useAssessmentWizard,
} from "@/components/assessment";
import type { AssessmentQuestion } from "@/types";

function makeQuestion(order: number, optionCount = 4): AssessmentQuestion {
  return {
    id: `q${order}`,
    text: `Pregunta ${order}`,
    category: "FRONTEND",
    order,
    options: Array.from({ length: optionCount }, (_, index) => ({
      id: `q${order}-o${index + 1}`,
      text: `Opción ${index + 1} de la pregunta ${order}`,
      order: index + 1,
    })),
  };
}

const THREE_QUESTIONS = [makeQuestion(1), makeQuestion(2), makeQuestion(3, 3)];

describe("assessmentWizardReducer", () => {
  it("select guarda la respuesta de la pregunta", () => {
    const state = assessmentWizardReducer(initialAssessmentWizardState, {
      type: "select",
      questionId: "q1",
      optionId: "q1-o2",
    });
    expect(state.answers).toEqual({ q1: "q1-o2" });
  });

  it("select sobrescribe la respuesta previa de la misma pregunta sin tocar las demás", () => {
    const start: AssessmentWizardState = { currentIndex: 0, answers: { q1: "q1-o1", q2: "q2-o3" } };
    const state = assessmentWizardReducer(start, {
      type: "select",
      questionId: "q1",
      optionId: "q1-o4",
    });
    expect(state.answers).toEqual({ q1: "q1-o4", q2: "q2-o3" });
  });

  it("next avanza un paso", () => {
    const state = assessmentWizardReducer(initialAssessmentWizardState, { type: "next", total: 3 });
    expect(state.currentIndex).toBe(1);
  });

  it("next no pasa de total - 1", () => {
    const start: AssessmentWizardState = { currentIndex: 2, answers: {} };
    const state = assessmentWizardReducer(start, { type: "next", total: 3 });
    expect(state.currentIndex).toBe(2);
  });

  it("prev retrocede un paso y conserva las respuestas", () => {
    const answers = { q1: "q1-o1", q2: "q2-o2" };
    const start: AssessmentWizardState = { currentIndex: 1, answers };
    const state = assessmentWizardReducer(start, { type: "prev" });
    expect(state.currentIndex).toBe(0);
    expect(state.answers).toEqual(answers);
  });

  it("prev no baja de 0", () => {
    const state = assessmentWizardReducer(initialAssessmentWizardState, { type: "prev" });
    expect(state.currentIndex).toBe(0);
  });

  it("cada acción devuelve un estado nuevo sin mutar el anterior", () => {
    const start: AssessmentWizardState = { currentIndex: 1, answers: { q1: "q1-o1" } };
    const snapshot = structuredClone(start);

    const afterSelect = assessmentWizardReducer(start, {
      type: "select",
      questionId: "q2",
      optionId: "q2-o1",
    });
    const afterNext = assessmentWizardReducer(start, { type: "next", total: 3 });
    const afterPrev = assessmentWizardReducer(start, { type: "prev" });

    expect(afterSelect).not.toBe(start);
    expect(afterSelect.answers).not.toBe(start.answers);
    expect(afterNext).not.toBe(start);
    expect(afterPrev).not.toBe(start);
    expect(start).toEqual(snapshot);
  });
});

describe("buildAssessmentAnswers", () => {
  it("devuelve una entrada por pregunta respondida, en el orden de las preguntas", () => {
    const answers = { q3: "q3-o1", q1: "q1-o2", q2: "q2-o4" };
    expect(buildAssessmentAnswers(THREE_QUESTIONS, answers)).toEqual([
      { questionId: "q1", optionId: "q1-o2" },
      { questionId: "q2", optionId: "q2-o4" },
      { questionId: "q3", optionId: "q3-o1" },
    ]);
  });

  it("omite las preguntas sin respuesta", () => {
    expect(buildAssessmentAnswers(THREE_QUESTIONS, { q2: "q2-o1" })).toEqual([
      { questionId: "q2", optionId: "q2-o1" },
    ]);
  });

  it("devuelve un array vacío sin respuestas", () => {
    expect(buildAssessmentAnswers(THREE_QUESTIONS, {})).toEqual([]);
  });
});

describe("useAssessmentWizard", () => {
  it("empieza en la primera pregunta sin respuestas", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.currentQuestion.id).toBe("q1");
    expect(result.current.total).toBe(3);
    expect(result.current.answers).toEqual({});
    expect(result.current.selectedOptionId).toBeUndefined();
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(false);
  });

  it("canGoNext pasa de false a true tras select", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));
    expect(result.current.canGoNext).toBe(false);

    act(() => result.current.select("q1-o2"));

    expect(result.current.canGoNext).toBe(true);
    expect(result.current.selectedOptionId).toBe("q1-o2");
    expect(result.current.answers).toEqual({ q1: "q1-o2" });
  });

  it("select reemplaza la opción elegida en la misma pregunta", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    act(() => result.current.select("q1-o1"));
    act(() => result.current.select("q1-o3"));

    expect(result.current.selectedOptionId).toBe("q1-o3");
    expect(result.current.answers).toEqual({ q1: "q1-o3" });
  });

  it("next no avanza sin respuesta en la pregunta actual", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    act(() => result.current.next());

    expect(result.current.currentIndex).toBe(0);
  });

  it("next avanza tras responder", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    act(() => result.current.select("q1-o1"));
    act(() => result.current.next());

    expect(result.current.currentIndex).toBe(1);
    expect(result.current.currentQuestion.id).toBe("q2");
    expect(result.current.isFirst).toBe(false);
    expect(result.current.canGoNext).toBe(false);
  });

  it("marca isLast en la última pregunta", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    act(() => result.current.select("q1-o1"));
    act(() => result.current.next());
    act(() => result.current.select("q2-o1"));
    act(() => result.current.next());

    expect(result.current.currentQuestion.id).toBe("q3");
    expect(result.current.isLast).toBe(true);
  });

  it("con una sola pregunta, isFirst e isLast son true a la vez", () => {
    const single = [makeQuestion(1)];
    const { result } = renderHook(() => useAssessmentWizard(single));

    expect(result.current.total).toBe(1);
    expect(result.current.isFirst).toBe(true);
    expect(result.current.isLast).toBe(true);
  });

  it("ordena las preguntas por order sin depender del orden del array", () => {
    const unordered = [makeQuestion(2), makeQuestion(1)];
    const { result } = renderHook(() => useAssessmentWizard(unordered));

    expect(result.current.currentQuestion.order).toBe(1);
    expect(result.current.questions.map((question) => question.order)).toEqual([1, 2]);
    expect(unordered.map((question) => question.order)).toEqual([2, 1]);
  });

  it("selectedOptionId refleja la respuesta previa al volver atrás", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    act(() => result.current.select("q1-o2"));
    act(() => result.current.next());
    act(() => result.current.prev());

    expect(result.current.currentIndex).toBe(0);
    expect(result.current.selectedOptionId).toBe("q1-o2");
    expect(result.current.canGoNext).toBe(true);
  });

  it("cambiar una respuesta anterior no altera las demás", () => {
    const { result } = renderHook(() => useAssessmentWizard(THREE_QUESTIONS));

    act(() => result.current.select("q1-o1"));
    act(() => result.current.next());
    act(() => result.current.select("q2-o2"));
    act(() => result.current.next());
    act(() => result.current.select("q3-o3"));
    act(() => result.current.prev());
    act(() => result.current.prev());
    act(() => result.current.select("q1-o4"));

    expect(result.current.answers).toEqual({ q1: "q1-o4", q2: "q2-o2", q3: "q3-o3" });
  });

  it("getAnswers devuelve las respuestas en el orden de order", () => {
    const unordered = [makeQuestion(2), makeQuestion(1)];
    const { result } = renderHook(() => useAssessmentWizard(unordered));

    act(() => result.current.select("q1-o3"));
    act(() => result.current.next());
    act(() => result.current.select("q2-o1"));

    expect(result.current.getAnswers()).toEqual([
      { questionId: "q1", optionId: "q1-o3" },
      { questionId: "q2", optionId: "q2-o1" },
    ]);
  });
});
