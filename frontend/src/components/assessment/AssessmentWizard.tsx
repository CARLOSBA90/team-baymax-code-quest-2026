import { useEffect, useId, useRef } from "react";
import { getSkillCategoryLabel } from "@/lib";
import type { AssessmentAnswer, AssessmentQuestion as AssessmentQuestionData } from "@/types";
import { AssessmentNav } from "./AssessmentNav";
import { AssessmentProgress, type AssessmentProgressSegmentState } from "./AssessmentProgress";
import { AssessmentQuestion } from "./AssessmentQuestion";
import { useAssessmentWizard } from "./useAssessmentWizard";

export interface AssessmentWizardProps {
  questions: AssessmentQuestionData[];
  onSubmit: (answers: AssessmentAnswer[]) => void;
  isSubmitting?: boolean;
}

export function AssessmentWizard({ questions, ...rest }: AssessmentWizardProps) {
  if (questions.length === 0) return null;
  return <AssessmentWizardContent questions={questions} {...rest} />;
}

function AssessmentWizardContent({
  questions,
  onSubmit,
  isSubmitting = false,
}: AssessmentWizardProps) {
  const {
    questions: sortedQuestions,
    currentIndex,
    currentQuestion,
    total,
    answers,
    selectedOptionId,
    isFirst,
    isLast,
    canGoNext,
    select,
    next,
    prev,
    getAnswers,
  } = useAssessmentWizard(questions);
  const labelId = useId();
  const titleRef = useRef<HTMLHeadingElement>(null);
  const hasNavigatedRef = useRef(false);

  // biome-ignore lint/correctness/useExhaustiveDependencies: currentIndex es el disparador intencionado; el efecto debe re-ejecutarse en cada cambio de paso para mover el foco al título de la nueva pregunta
  useEffect(() => {
    if (!hasNavigatedRef.current) return;
    titleRef.current?.focus();
  }, [currentIndex]);

  const segments: AssessmentProgressSegmentState[] = sortedQuestions.map((question, index) => {
    if (index === currentIndex) return "current";
    return answers[question.id] === undefined ? "pending" : "answered";
  });

  const sectionLabel =
    currentQuestion.sectionLabel ?? getSkillCategoryLabel(currentQuestion.category);

  const handleNext = () => {
    hasNavigatedRef.current = true;
    next();
  };

  const handlePrev = () => {
    hasNavigatedRef.current = true;
    prev();
  };

  return (
    <div className="w-full max-w-3xl">
      <AssessmentProgress
        current={currentIndex + 1}
        total={total}
        sectionLabel={sectionLabel}
        labelId={labelId}
        segments={segments}
      />
      <AssessmentQuestion
        key={currentQuestion.id}
        question={currentQuestion}
        selectedOptionId={selectedOptionId}
        onSelect={select}
        titleRef={titleRef}
        describedById={labelId}
      />
      <AssessmentNav
        isFirst={isFirst}
        isLast={isLast}
        canGoNext={canGoNext}
        isSubmitting={isSubmitting}
        onPrev={handlePrev}
        onNext={handleNext}
        onSubmit={() => onSubmit(getAnswers())}
      />
    </div>
  );
}
