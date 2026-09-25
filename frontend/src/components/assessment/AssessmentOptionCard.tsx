import type { AssessmentOption } from "@/types";

export interface AssessmentOptionCardProps {
  /** Nombre del grupo de radios: `question-${questionId}`. */
  name: string;
  option: AssessmentOption;
  checked: boolean;
  onSelect: (optionId: string) => void;
}

export function AssessmentOptionCard({
  name,
  option,
  checked,
  onSelect,
}: AssessmentOptionCardProps) {
  return (
    <label className="group flex min-w-0 cursor-pointer items-start gap-3 rounded-xl border border-border-field bg-bg-ghost px-5 py-4 transition-colors hover:border-border-field-hover hover:bg-bg-ghost-hover has-checked:border-accent-soft/60 has-checked:bg-bg-nav-active has-focus-visible:border-accent-hover has-focus-visible:shadow-ring-focus">
      <input
        type="radio"
        className="sr-only"
        name={name}
        value={option.id}
        checked={checked}
        onChange={() => onSelect(option.id)}
      />
      <span aria-hidden="true" className="flex h-6 shrink-0 items-center">
        <span className="flex size-5 items-center justify-center rounded-full border-2 border-border-ghost-hover transition-colors group-has-checked:border-accent-soft">
          <span className="hidden size-2 rounded-full bg-accent-soft group-has-checked:block" />
        </span>
      </span>
      <span className="min-w-0 font-semibold text-text-primary">{option.text}</span>
    </label>
  );
}
