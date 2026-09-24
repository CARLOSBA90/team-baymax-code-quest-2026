import { RoadmapItemType } from '../../../generated/prisma/enums.js';
import {
  DEFAULT_CHALLENGE_FILE_EXTENSIONS,
  DEFAULT_CHALLENGE_LANGUAGES,
  LEGACY_COMPLETION_TYPE,
  MAX_CHALLENGE_FILE_BYTES,
  SubmissionType,
  TRACKING_DISABLED_MISSING_DURATION,
  TRACKING_DISABLED_MISSING_SYLLABUS,
  TrackingType,
  VIDEO_REPORT_INTERVAL_SECONDS,
} from '../progress.constants.js';
import { readSyllabus, syllabusLessonIds } from './lesson-syllabus.js';

export interface TrackingPolicy {
  type: TrackingType;
  enabled: boolean;
  disabledReason: string | null;
  durationSeconds: number | null;
  acceptedSubmissionTypes: SubmissionType[];
  allowedLanguages: string[];
  allowedFileExtensions: string[];
  maxFileSizeBytes: number | null;
  /** Lesson ids of the item's syllabus snapshot (LESSONS only). */
  lessonIds: string[];
}

function object(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : {};
}

function strings(value: unknown): string[] | null {
  if (!Array.isArray(value)) return null;
  const list = value
    .filter((entry): entry is string => typeof entry === 'string')
    .map((entry) => entry.trim().toLowerCase())
    .filter((entry) => entry.length > 0);
  return list.length > 0 ? list : null;
}

function extensions(value: unknown): string[] | null {
  return (
    strings(value)?.map((entry) =>
      entry.startsWith('.') ? entry : `.${entry}`,
    ) ?? null
  );
}

function submissionTypes(value: unknown): SubmissionType[] {
  const valid = Object.values(SubmissionType);
  const configured = Array.isArray(value)
    ? valid.filter((type) => value.includes(type))
    : [];
  return configured.length > 0 ? configured : valid;
}

function maxFileSize(value: unknown): number {
  const size = Number(value);
  return Number.isInteger(size) && size > 0
    ? Math.min(size, MAX_CHALLENGE_FILE_BYTES)
    : MAX_CHALLENGE_FILE_BYTES;
}

export function resolveTrackingPolicy(
  itemType: RoadmapItemType,
  contentData: unknown,
): TrackingPolicy {
  const tracking = object(object(contentData).tracking);
  const configured =
    tracking.type === LEGACY_COMPLETION_TYPE
      ? TrackingType.COMPLETION
      : tracking.type;
  const explicit = Object.values(TrackingType).includes(
    configured as TrackingType,
  )
    ? (configured as TrackingType)
    : null;
  const type =
    explicit ??
    (itemType === RoadmapItemType.CHALLENGE
      ? TrackingType.CHALLENGE
      : TrackingType.COMPLETION);
  const duration = Number(tracking.durationSeconds);
  const durationSeconds =
    type === TrackingType.VIDEO && Number.isFinite(duration) && duration > 0
      ? duration
      : null;
  const lessonIds =
    type === TrackingType.LESSONS
      ? syllabusLessonIds(readSyllabus(contentData))
      : [];
  const disabledReason =
    type === TrackingType.VIDEO && durationSeconds === null
      ? TRACKING_DISABLED_MISSING_DURATION
      : type === TrackingType.LESSONS && lessonIds.length === 0
        ? TRACKING_DISABLED_MISSING_SYLLABUS
        : null;
  const challenge = type === TrackingType.CHALLENGE;
  return {
    type,
    enabled: disabledReason === null,
    disabledReason,
    durationSeconds,
    acceptedSubmissionTypes: challenge
      ? submissionTypes(tracking.acceptedSubmissionTypes)
      : [],
    allowedLanguages: challenge
      ? (strings(tracking.allowedLanguages) ?? DEFAULT_CHALLENGE_LANGUAGES)
      : [],
    allowedFileExtensions: challenge
      ? (extensions(tracking.allowedFileExtensions) ??
        DEFAULT_CHALLENGE_FILE_EXTENSIONS)
      : [],
    maxFileSizeBytes: challenge ? maxFileSize(tracking.maxFileSizeBytes) : null,
    lessonIds,
  };
}

export function serializeTrackingPolicy(policy: TrackingPolicy) {
  return {
    type: policy.type,
    enabled: policy.enabled,
    disabled_reason: policy.disabledReason,
    // How often a playing video (or video lesson) reports its position.
    report_interval_seconds:
      (policy.type === TrackingType.VIDEO ||
        policy.type === TrackingType.LESSONS) &&
      policy.enabled
        ? VIDEO_REPORT_INTERVAL_SECONDS
        : null,
    metadata:
      policy.type === TrackingType.VIDEO
        ? { duration_seconds: policy.durationSeconds }
        : policy.type === TrackingType.LESSONS
          ? { total_lessons: policy.lessonIds.length }
          : null,
    ...(policy.type === TrackingType.CHALLENGE && {
      accepted_submission_types: policy.acceptedSubmissionTypes,
      allowed_languages: policy.allowedLanguages,
      allowed_file_extensions: policy.allowedFileExtensions,
      max_file_size_bytes: policy.maxFileSizeBytes,
    }),
  };
}
