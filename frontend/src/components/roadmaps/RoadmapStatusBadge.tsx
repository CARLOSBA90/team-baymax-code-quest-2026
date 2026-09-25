import { ROADMAP_STATUS_LABELS } from "@/lib";
import type { RoadmapStatus } from "@/types";

export interface RoadmapStatusBadgeProps {
  status: RoadmapStatus;
}

const BADGE_CLASSES: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "text-status-started bg-status-started/12 border-status-started/35",
  PAUSED: "text-status-paused bg-status-paused/12 border-status-paused/35",
  COMPLETED: "text-status-completed bg-status-completed/12 border-status-completed/35",
  NOT_STARTED: "text-status-idle bg-status-idle/12 border-status-idle/35",
};

const DOT_CLASSES: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "bg-status-started",
  PAUSED: "bg-status-paused",
  COMPLETED: "bg-status-completed",
  NOT_STARTED: "bg-status-idle",
};

/** Pill de estado: el color acompaña siempre al texto, nunca lo sustituye. */
export function RoadmapStatusBadge({ status }: RoadmapStatusBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 font-body font-semibold text-sm ${BADGE_CLASSES[status]}`}
    >
      <span
        aria-hidden="true"
        className={`size-1.5 shrink-0 rounded-full ${DOT_CLASSES[status]}`}
      />
      {ROADMAP_STATUS_LABELS[status]}
    </span>
  );
}
