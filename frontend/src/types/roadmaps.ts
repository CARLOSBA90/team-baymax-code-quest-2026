import type { PageMeta } from "./api";

export type RoadmapStatus = "NOT_STARTED" | "IN_PROGRESS" | "PAUSED" | "COMPLETED";

export type RoadmapLevel = "beginner" | "intermediate" | "advanced";

export type RoadmapAccent = "violet" | "cyan" | "amber" | "pink" | "emerald";

export interface RoadmapSummary {
  id: string;
  name: string;
  status: RoadmapStatus;
  /** Entero 0-100. */
  progress: number;
  lastActivity: string;
  pausedAt: string | null;
  activityVersion: number;
  totalItems: number;
  totalCourses: number;
  level: RoadmapLevel | null;
  /** Solo presentación; el backend aún no lo envía. Fallback: `getRoadmapMonogram`. */
  monogram?: string;
  /** Solo presentación; el backend aún no lo envía. Fallback: `"neutral"`. */
  accent?: RoadmapAccent;
}

export interface RoadmapCounts {
  all: number;
  notStarted: number;
  inProgress: number;
  paused: number;
  completed: number;
}

export interface RoadmapsListResult {
  items: RoadmapSummary[];
  meta: PageMeta;
  counts: RoadmapCounts;
}

/**
 * Forma en el cable (snake_case), espejo de `serializeRoadmapSummary` del backend.
 * Solo la usan el mock y el service; la UI consume `RoadmapSummary`.
 */
export interface RoadmapSummaryDto {
  id: string;
  name: string;
  status: RoadmapStatus;
  progress: number;
  last_activity: string;
  paused_at: string | null;
  activity_version: number;
  total_items: number;
  total_courses: number;
  level: RoadmapLevel | null;
  /** Solo presentación; el backend aún no lo envía. */
  monogram?: string;
  /** Solo presentación; el backend aún no lo envía. */
  accent?: RoadmapAccent;
}

/** Respuesta de `GET /roadmaps` en el cable. */
export interface RoadmapsListResponseDto {
  data: RoadmapSummaryDto[];
  meta: PageMeta;
  counts: RoadmapCounts;
}
