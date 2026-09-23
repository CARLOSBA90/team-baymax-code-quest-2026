import { RoadmapItemType } from '../../../generated/prisma/enums.js';
import { TrackingType } from '../progress.constants.js';

export interface TrackingPolicy {
  type: TrackingType;
  durationSeconds: number | null;
  acceptedSubmissionTypes: string[];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

export function resolveTrackingPolicy(
  itemType: RoadmapItemType,
  contentData: unknown,
): TrackingPolicy {
  const tracking = object(object(contentData).tracking);
  const explicit = Object.values(TrackingType).includes(
    tracking.type as TrackingType,
  )
    ? (tracking.type as TrackingType)
    : null;
  const type =
    explicit ??
    (itemType === RoadmapItemType.CHALLENGE
      ? TrackingType.CHALLENGE
      : TrackingType.MANUAL);
  const duration = Number(tracking.durationSeconds);
  return {
    type,
    durationSeconds:
      Number.isFinite(duration) && duration > 0 ? duration : null,
    acceptedSubmissionTypes: Array.isArray(tracking.acceptedSubmissionTypes)
      ? tracking.acceptedSubmissionTypes.filter(
          (value): value is string => typeof value === 'string',
        )
      : [],
  };
}
