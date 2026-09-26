import { clampProgress, getRoadmapProgressSummary, getRoadmapProgressValueText } from "@/lib";
import type { RoadmapStatus } from "@/types";

export interface RoadmapProgressProps {
  progress: number;
  status: RoadmapStatus;
  completed: number;
  total: number;
  totalMinutes: number;
  remainingMinutes: number;
  /** Id del h1 de la ruta: da nombre a la barra. */
  labelledBy: string;
}

/** Relleno de la barra por estado. NOT_STARTED se trata como en curso (violeta). */
const FILL_CLASSES: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "bg-status-started-bar",
  NOT_STARTED: "bg-status-started-bar",
  PAUSED: "bg-status-paused-bar",
  COMPLETED: "bg-status-completed",
};

const PERCENT_CLASSES: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "text-accent-soft",
  NOT_STARTED: "text-accent-soft",
  PAUSED: "text-status-paused-text",
  COMPLETED: "text-status-completed-text",
};

/** Progreso global del detalle: barra sin tarjeta + resumen de pasos/horas y porcentaje. */
export function RoadmapProgress({
  progress,
  status,
  completed,
  total,
  totalMinutes,
  remainingMinutes,
  labelledBy,
}: RoadmapProgressProps) {
  const value = clampProgress(progress);
  const summary = getRoadmapProgressSummary({
    completed,
    total,
    totalMinutes,
    remainingMinutes,
    isCompleted: status === "COMPLETED",
  });

  return (
    <div className="flex flex-col gap-2.5">
      <div
        role="progressbar"
        aria-labelledby={labelledBy}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={value}
        aria-valuetext={getRoadmapProgressValueText(progress, completed, total)}
        className="h-2 w-full rounded-full bg-progress-track"
      >
        <div
          data-testid="roadmap-detail-progress-fill"
          className={`h-full rounded-full ${FILL_CLASSES[status]}`}
          style={{ width: `${value}%` }}
        />
      </div>
      <div className="flex items-baseline justify-between gap-4">
        <p className="font-body text-sm text-text-secondary">{summary}</p>
        <span
          className={`shrink-0 font-body font-bold text-sm tabular-nums ${PERCENT_CLASSES[status]}`}
        >
          {value}%
        </span>
      </div>
    </div>
  );
}
