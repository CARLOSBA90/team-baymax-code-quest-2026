import {
  PROGRESS_MAX_PERCENTAGE,
  PROGRESS_MIN_PERCENTAGE,
  RoadmapStatus,
} from '../roadmap.constants.js';

export interface RoadmapProgressSummary {
  progress: number;
  status: RoadmapStatus;
}

/** Hundredths of a percent kept in progress values (0.26 %, 22.5 %…). */
const PERCENT_PRECISION = 100;
/** Absorbs binary floating point error before truncating (0.29 * 100). */
const FLOAT_TOLERANCE = 1e-9;

/**
 * Truncates a percentage to two decimals (1 of 390 lessons → 0.25). Truncating
 * instead of rounding never reports more than was covered, so an unfinished
 * item or roadmap can never show 100.
 */
export function truncatePercentage(value: number): number {
  return (
    Math.floor(value * PERCENT_PRECISION + FLOAT_TOLERANCE) / PERCENT_PRECISION
  );
}

/**
 * Roadmap progress is the truncated average of its items. It is NOT_STARTED
 * only while every item is at 0 and none has recorded activity (`started`).
 */
export function aggregateRoadmapProgress(
  percentages: number[],
  pausedAt: Date | null,
  started = false,
): RoadmapProgressSummary {
  if (percentages.length === 0) {
    return {
      progress: PROGRESS_MIN_PERCENTAGE,
      status: RoadmapStatus.NOT_STARTED,
    };
  }

  const progress = truncatePercentage(
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
  if (
    !started &&
    percentages.every((value) => value === PROGRESS_MIN_PERCENTAGE)
  ) {
    return {
      progress: PROGRESS_MIN_PERCENTAGE,
      status: RoadmapStatus.NOT_STARTED,
    };
  }
  return { progress, status: RoadmapStatus.IN_PROGRESS };
}
