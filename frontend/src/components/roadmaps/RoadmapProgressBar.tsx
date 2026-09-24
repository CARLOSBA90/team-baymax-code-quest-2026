import { clampProgress } from "@/lib";
import type { RoadmapStatus } from "@/types";

export interface RoadmapProgressBarProps {
  value: number;
  status: RoadmapStatus;
  roadmapName: string;
}

const FILL_CLASSES: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "bg-status-started-bar",
  PAUSED: "bg-status-paused",
  COMPLETED: "bg-status-completed",
  NOT_STARTED: "bg-status-idle",
};

export function RoadmapProgressBar({ value, status, roadmapName }: RoadmapProgressBarProps) {
  const progress = clampProgress(value);
  return (
    <div className="flex min-w-0 flex-1 items-center gap-4">
      <div
        role="progressbar"
        aria-valuenow={progress}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={`Progreso de ${roadmapName}`}
        className="h-1.5 min-w-0 flex-1 rounded-full bg-progress-track"
      >
        <div
          data-testid="roadmap-progress-fill"
          className={`h-full rounded-full ${FILL_CLASSES[status]}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      <span className="w-11 shrink-0 text-right font-body font-semibold text-sm text-text-primary tabular-nums">
        {progress}%
      </span>
    </div>
  );
}
