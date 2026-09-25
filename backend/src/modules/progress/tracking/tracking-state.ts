import { createHash } from 'node:crypto';
import { TRACKING_STATE_SCHEMA_VERSION } from '../progress.constants.js';

/** Per-item state kept by the backend so the student can resume. */
export interface TrackingState {
  schemaVersion: number;
  lastPositionSeconds?: number;
  maxPositionSeconds?: number;
  /** Lesson ids marked as done (LESSONS tracking). */
  completedLessons?: string[];
  /** Last lesson the student marked, to resume from the next one. */
  lastLessonId?: string;
  /** Last second reported by the player for each lesson, to resume it. */
  lessonPositions?: Record<string, number>;
}

function isPositionMap(value: unknown): value is Record<string, number> {
  return (
    Boolean(value) &&
    typeof value === 'object' &&
    !Array.isArray(value) &&
    Object.values(value as object).every(
      (second) => typeof second === 'number' && Number.isFinite(second),
    )
  );
}

/** Reads the stored state, ignoring legacy fields such as event receipts. */
export function readTrackingState(value: unknown): TrackingState {
  const state =
    value && typeof value === 'object' && !Array.isArray(value)
      ? (value as Record<string, unknown>)
      : {};
  return {
    schemaVersion: TRACKING_STATE_SCHEMA_VERSION,
    ...(typeof state.lastPositionSeconds === 'number' && {
      lastPositionSeconds: state.lastPositionSeconds,
    }),
    ...(typeof state.maxPositionSeconds === 'number' && {
      maxPositionSeconds: state.maxPositionSeconds,
    }),
    ...(typeof state.lastLessonId === 'string' && {
      lastLessonId: state.lastLessonId,
    }),
    ...(isPositionMap(state.lessonPositions) && {
      lessonPositions: state.lessonPositions,
    }),
    ...(Array.isArray(state.completedLessons) && {
      completedLessons: state.completedLessons.filter(
        (id): id is string => typeof id === 'string',
      ),
    }),
  };
}

/**
 * Fingerprint of a report's content. The backend uses it to recognise a
 * retried submission without asking the client for an idempotency key.
 */
export function contentFingerprint(content: unknown): string {
  return createHash('sha256').update(JSON.stringify(content)).digest('hex');
}
