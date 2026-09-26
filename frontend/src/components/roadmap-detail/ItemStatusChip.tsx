import { clampProgress } from "@/lib";
import type { RoadmapItemState } from "@/types";

export interface ItemStatusChipProps {
  state: RoadmapItemState;
  /** Progreso del ítem (0-100); solo se muestra en «En curso» parcial. */
  progress: number;
  /** Clases de layout del padre (`order-*`, `self-*`). */
  className?: string;
}

const VIOLET_CHIP = "text-accent-soft bg-accent-hover/14 border-status-started/32";

const CHIPS: Record<Exclude<RoadmapItemState, "pending">, { label: string; classes: string }> = {
  completed: {
    label: "Completado",
    classes: "text-status-completed-text bg-status-completed/10 border-status-completed/30",
  },
  next: { label: "Siguiente", classes: VIOLET_CHIP },
  in_progress: { label: "En curso", classes: VIOLET_CHIP },
};

/**
 * Chip de estado del ítem (pendiente → nada). «En curso» con progreso parcial añade una mini barra
 * decorativa y el % como texto `sr-only` («En curso, 40 %»), sin `role="progressbar"`.
 */
export function ItemStatusChip({ state, progress, className }: ItemStatusChipProps) {
  if (state === "pending") return null;

  const { label, classes } = CHIPS[state];
  const value = clampProgress(progress);
  const showBar = state === "in_progress" && value > 0 && value < 100;

  return (
    <span
      className={`inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-body font-semibold text-xs ${classes} ${className ?? ""}`}
    >
      {label}
      {showBar ? (
        <>
          <span className="sr-only">, {value} %</span>
          <span
            aria-hidden="true"
            className="h-1 w-16 overflow-hidden rounded-full bg-progress-track"
          >
            <span
              data-testid="item-progress-fill"
              className="block h-full rounded-full bg-status-started-bar"
              style={{ width: `${value}%` }}
            />
          </span>
        </>
      ) : null}
    </span>
  );
}
