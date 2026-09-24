export enum TrackingType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  /** Completed when the student marks it (external course, no playback data). */
  COMPLETION = 'COMPLETION',
  /** Course with a syllabus: progress is the share of lessons marked done. */
  LESSONS = 'LESSONS',
  CHALLENGE = 'CHALLENGE',
}

export enum SubmissionType {
  TEXT = 'TEXT',
  CODE = 'CODE',
  LINK = 'LINK',
  FILE = 'FILE',
}

export enum ReviewDecision {
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export const TRACKING_STATE_SCHEMA_VERSION = 2;
/** Legacy tracking type stored before COMPLETION existed. */
export const LEGACY_COMPLETION_TYPE = 'MANUAL';
/** An identical submission within this window is treated as a retry. */
export const DUPLICATE_SUBMISSION_WINDOW_MS = 10 * 60 * 1000;
export const VIDEO_REPORT_INTERVAL_SECONDS = 15;
/** Upper bound for a reported playback position (24 h). */
export const MAX_POSITION_SECONDS = 24 * 60 * 60;
export const MAX_SUBMISSION_TEXT_LENGTH = 50_000;
export const MAX_CHALLENGE_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_SUBMISSION_LANGUAGE_LENGTH = 40;
export const DEFAULT_CHALLENGE_LANGUAGES = [
  'typescript',
  'javascript',
  'python',
  'java',
  'csharp',
  'go',
  'sql',
  'html',
  'css',
  'bash',
];
export const DEFAULT_CHALLENGE_FILE_EXTENSIONS = [
  '.pdf',
  '.zip',
  '.png',
  '.jpg',
  '.jpeg',
  '.txt',
  '.md',
];
export const TRACKING_DISABLED_MISSING_DURATION = 'TRACKING_METADATA_MISSING';
export const TRACKING_DISABLED_MISSING_SYLLABUS = 'SYLLABUS_MISSING';
export const MANUAL_EVALUATOR_VERSION = 'manual-v1';
