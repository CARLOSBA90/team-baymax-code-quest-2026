import { type Ref, useId, useMemo } from "react";
import { DEFAULT_ASSESSMENT_HELPER_TEXT } from "@/lib";
import type { AssessmentQuestion as AssessmentQuestionData } from "@/types";
import { AssessmentOptionCard } from "./AssessmentOptionCard";

export interface AssessmentQuestionProps {
  question: AssessmentQuestionData;
  selectedOptionId: string | undefined;
  onSelect: (optionId: string) => void;
  titleRef: Ref<HTMLHeadingElement>;
  /** Id del texto "Pregunta N de M", que describe el título. */
  describedById: string;
}

export function AssessmentQuestion({
  question,
  selectedOptionId,
  onSelect,
  titleRef,
  describedById,
}: AssessmentQuestionProps) {
  const helperId = useId();
  const helperText = question.helperText ?? DEFAULT_ASSESSMENT_HELPER_TEXT;
  const options = useMemo(
    () => [...question.options].sort((a, b) => a.order - b.order),
    [question.options],
  );
  const name = `question-${question.id}`;

  return (
    <fieldset className="mt-7" aria-describedby={helperText ? helperId : undefined}>
      <legend>
        <h2
          ref={titleRef}
          tabIndex={-1}
          aria-describedby={describedById}
          className="font-display text-2xl font-bold md:text-3xl text-text-primary outline-none"
        >
          {question.text}
        </h2>
      </legend>
      {helperText ? (
        <p id={helperId} className="mt-1 text-text-secondary">
          {helperText}
        </p>
      ) : null}
      <div className="mt-5 grid auto-rows-fr grid-cols-1 gap-3 lg:grid-cols-2">
        {options.map((option) => (
          <AssessmentOptionCard
            key={option.id}
            name={name}
            option={option}
            checked={option.id === selectedOptionId}
            onSelect={onSelect}
          />
        ))}
      </div>
    </fieldset>
  );
}
