export enum TrackingType {
  VIDEO = 'VIDEO',
  READING = 'READING',
  MANUAL = 'MANUAL',
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

export const TRACKING_STATE_SCHEMA_VERSION = 1;
export const TRACKING_RECEIPT_LIMIT = 1000;
export const TRACKING_RECEIPT_TTL_MS = 24 * 60 * 60 * 1000;
export const VIDEO_REPORT_INTERVAL_SECONDS = 15;
export const MAX_SUBMISSION_TEXT_LENGTH = 50_000;
export const MAX_CHALLENGE_FILE_BYTES = 5 * 1024 * 1024;
export const MANUAL_EVALUATOR_VERSION = 'manual-v1';
