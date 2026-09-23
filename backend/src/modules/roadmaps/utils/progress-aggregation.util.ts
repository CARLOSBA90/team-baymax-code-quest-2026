import {
  PROGRESS_MAX_PERCENTAGE,
  PROGRESS_MIN_PERCENTAGE,
  RoadmapStatus,
} from '../roadmap.constants.js';

export interface RoadmapProgressSummary {
  progress: number;
  status: RoadmapStatus;
}

export function aggregateRoadmapProgress(
  percentages: number[],
  pausedAt: Date | null,
): RoadmapProgressSummary {
  if (percentages.length === 0) {
    return {
      progress: PROGRESS_MIN_PERCENTAGE,
      status: RoadmapStatus.NOT_STARTED,
    };
  }

  const progress = Math.floor(
    percentages.reduce((sum, value) => sum + value, PROGRESS_MIN_PERCENTAGE) /
      percentages.length,
  );

  if (percentages.every((value) => value === PROGRESS_MAX_PERCENTAGE)) {
    return {
      progress: PROGRESS_MAX_PERCENTAGE,
      status: RoadmapStatus.COMPLETED,
    };
  }
  if (pausedAt) {
    return { progress, status: RoadmapStatus.PAUSED };
  }
  if (percentages.every((value) => value === PROGRESS_MIN_PERCENTAGE)) {
    return {
      progress: PROGRESS_MIN_PERCENTAGE,
      status: RoadmapStatus.NOT_STARTED,
    };
  }
  return { progress, status: RoadmapStatus.IN_PROGRESS };
}
