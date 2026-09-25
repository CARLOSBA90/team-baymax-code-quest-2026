export type AssessmentProgressSegmentState = "answered" | "current" | "pending";

export interface AssessmentProgressProps {
  /** Posición actual, empezando en 1. */
  current: number;
  total: number;
  sectionLabel: string;
  /** Id del `<p>` "Pregunta N de M". */
  labelId: string;
  segments: AssessmentProgressSegmentState[];
}

const SEGMENT_CLASSES: Record<AssessmentProgressSegmentState, string> = {
  current: "bg-accent-soft",
  answered: "bg-accent-hover",
  pending: "bg-border-ghost",
};

export function AssessmentProgress({
  current,
  total,
  sectionLabel,
  labelId,
  segments,
}: AssessmentProgressProps) {
  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between gap-4">
        <p
          id={labelId}
          className="text-xs font-bold uppercase tracking-widest text-accent-soft"
        >{`Pregunta ${current} de ${total}`}</p>
        {sectionLabel ? <p className="text-sm text-text-secondary">{sectionLabel}</p> : null}
      </div>
      <ol aria-hidden="true" className="flex gap-1">
        {segments.map((state, index) => (
          <li
            // biome-ignore lint/suspicious/noArrayIndexKey: los segmentos son posiciones fijas sin id propio
            key={index}
            data-state={state}
            className={`h-1 flex-1 rounded-full transition-colors ${SEGMENT_CLASSES[state]}`}
          />
        ))}
      </ol>
    </div>
  );
}
