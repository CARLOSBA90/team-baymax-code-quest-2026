import { useCallback, useMemo, useReducer } from "react";
import type { AssessmentAnswer, AssessmentAnswers, AssessmentQuestion } from "@/types";

export interface AssessmentWizardState {
  currentIndex: number;
  answers: AssessmentAnswers;
}

export type AssessmentWizardAction =
  | { type: "select"; questionId: string; optionId: string }
  | { type: "next"; total: number }
  | { type: "prev" };

export const initialAssessmentWizardState: AssessmentWizardState = {
  currentIndex: 0,
  answers: {},
};

export function assessmentWizardReducer(
  state: AssessmentWizardState,
  action: AssessmentWizardAction,
): AssessmentWizardState {
  switch (action.type) {
    case "select":
      return {
        ...state,
        answers: { ...state.answers, [action.questionId]: action.optionId },
      };
    case "next":
      return {
        ...state,
        currentIndex: Math.max(0, Math.min(state.currentIndex + 1, action.total - 1)),
      };
    case "prev":
      return { ...state, currentIndex: Math.max(state.currentIndex - 1, 0) };
    default:
      return state;
  }
}

/** Una respuesta por pregunta, en el orden de `questions`; omite las no respondidas. */
export function buildAssessmentAnswers(
  questions: AssessmentQuestion[],
  answers: AssessmentAnswers,
): AssessmentAnswer[] {
  return questions.flatMap((question) => {
    const optionId = answers[question.id];
    return optionId === undefined ? [] : [{ questionId: question.id, optionId }];
  });
}

export interface UseAssessmentWizardResult {
  /** `questions` ordenadas por `order`; fuente única para quien necesite recorrerlas. */
  questions: AssessmentQuestion[];
  currentIndex: number;
  currentQuestion: AssessmentQuestion;
  total: number;
  answers: AssessmentAnswers;
  selectedOptionId: string | undefined;
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  select: (optionId: string) => void;
  next: () => void;
  prev: () => void;
  getAnswers: () => AssessmentAnswer[];
}

/** Precondición: `questions.length >= 1` (lo garantiza `AssessmentWizard`). */
export function useAssessmentWizard(questions: AssessmentQuestion[]): UseAssessmentWizardResult {
  const sortedQuestions = useMemo(
    () => [...questions].sort((a, b) => a.order - b.order),
    [questions],
  );
  const [state, dispatch] = useReducer(assessmentWizardReducer, initialAssessmentWizardState);

  const total = sortedQuestions.length;
  const currentIndex = Math.min(state.currentIndex, Math.max(total - 1, 0));
  const currentQuestion = sortedQuestions[currentIndex];
  const questionId = currentQuestion?.id;
  const selectedOptionId = questionId === undefined ? undefined : state.answers[questionId];
  const canGoNext = selectedOptionId !== undefined;

  const select = useCallback(
    (optionId: string) => {
      if (questionId === undefined) return;
      dispatch({ type: "select", questionId, optionId });
    },
    [questionId],
  );

  const next = useCallback(() => {
    if (!canGoNext) return;
    dispatch({ type: "next", total });
  }, [canGoNext, total]);

  const prev = useCallback(() => {
    dispatch({ type: "prev" });
  }, []);

  const getAnswers = useCallback(
    () => buildAssessmentAnswers(sortedQuestions, state.answers),
    [sortedQuestions, state.answers],
  );

  return {
    questions: sortedQuestions,
    currentIndex,
    currentQuestion,
    total,
    answers: state.answers,
    selectedOptionId,
    isFirst: currentIndex === 0,
    isLast: currentIndex === total - 1,
    canGoNext,
    select,
    next,
    prev,
    getAnswers,
  };
}
