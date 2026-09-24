import { PROGRESS_MAX_PERCENTAGE } from '../../roadmaps/roadmap.constants.js';
import { truncatePercentage } from '../../roadmaps/utils/progress-aggregation.util.js';

export interface VideoProgressResult {
  percentage: number;
  lastPositionSeconds: number;
  maxPositionSeconds: number;
}

export function calculateVideoProgress(
  reportedPositionSeconds: number,
  durationSeconds: number,
  previousMaximumSeconds: number,
): VideoProgressResult {
  const lastPositionSeconds = Math.min(
    Math.max(reportedPositionSeconds, 0),
    durationSeconds,
  );
  const maxPositionSeconds = Math.max(
    previousMaximumSeconds,
    lastPositionSeconds,
  );
  return {
    percentage: Math.min(
      PROGRESS_MAX_PERCENTAGE,
      truncatePercentage((maxPositionSeconds / durationSeconds) * 100),
    ),
    lastPositionSeconds,
    maxPositionSeconds,
  };
}
