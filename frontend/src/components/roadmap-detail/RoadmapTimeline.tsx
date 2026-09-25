import { useId } from "react";
import { getItemState, getStepsCompletedLabel } from "@/lib";
import type { RoadmapItem as RoadmapItemData } from "@/types";
import { RoadmapItem } from "./RoadmapItem";

export interface RoadmapTimelineProps {
  items: RoadmapItemData[];
  nextStepId: string | null;
  completed: number;
  isPaused: boolean;
  /** Id del párrafo del banner de pausa (solo en PAUSED). */
  pausedDescriptionId?: string;
}

/**
 * Sección «Pasos de la ruta»: h2 + contador («1 de 4» visible, «1 de 4 pasos completados» para
 * AT) y la lista ordenada de pasos con su riel/nodos. El estado de cada paso sale de
 * `getItemState`.
 */
export function RoadmapTimeline({
  items,
  nextStepId,
  completed,
  isPaused,
  pausedDescriptionId,
}: RoadmapTimelineProps) {
  const headingId = useId();
  const total = items.length;

  return (
    <section aria-labelledby={headingId} className="flex flex-col gap-3.5">
      <div className="flex items-baseline justify-between gap-4">
        <h2
          id={headingId}
          className="font-body font-bold text-text-secondary text-xs uppercase tracking-widest"
        >
          Pasos de la ruta
        </h2>
        <p className="font-body text-text-muted text-xs tabular-nums">
          <span aria-hidden="true">
            {completed} de {total}
          </span>
          <span className="sr-only">{getStepsCompletedLabel(completed, total)}</span>
        </p>
      </div>
      <ol aria-label="Pasos de la ruta" className="flex flex-col">
        {items.map((item, index) => (
          <RoadmapItem
            key={item.roadmapItemId}
            item={item}
            stepNumber={index + 1}
            total={total}
            state={getItemState(item, nextStepId)}
            isLast={index === total - 1}
            isPaused={isPaused}
            pausedDescriptionId={pausedDescriptionId}
          />
        ))}
      </ol>
    </section>
  );
}
