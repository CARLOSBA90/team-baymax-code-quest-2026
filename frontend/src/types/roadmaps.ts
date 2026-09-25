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
 * Solo la usa el service (y las fixtures de test); la UI consume `RoadmapSummary`.
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

/**
 * Tipo de un paso de la ruta. Unión abierta: el backend puede añadir tipos nuevos y el front
 * los tolera (se muestran, no se rompen).
 */
export type RoadmapItemType = "COURSE" | "MEDIA" | "CHALLENGE" | (string & {});

/** Tipo de seguimiento de un paso. Unión abierta (desconocido → `canTrack` devuelve `false`). */
export type RoadmapTrackingType =
  | "VIDEO"
  | "READING"
  | "COMPLETION"
  | "LESSONS"
  | "CHALLENGE"
  | (string & {});

/** Estado de presentación de un paso, derivado con `getItemState`. */
export type RoadmapItemState = "completed" | "in_progress" | "next" | "pending";

/** `tracking` de un ítem de `content[]` en el cable. `report_interval_seconds` se ignora. */
export interface RoadmapItemTrackingDto {
  type: RoadmapTrackingType;
  enabled: boolean;
  disabled_reason: string | null;
}

/**
 * Ítem de `content[]` de `GET /roadmaps/:id` en el cable. Solo los campos consumidos:
 * `reason`, `details`, `syllabus`, `resume` y `progress_version` se ignoran.
 */
export interface RoadmapItemDto {
  roadmap_item_id: string;
  type: RoadmapItemType;
  order: number;
  course_id: string | null;
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
  level: RoadmapLevel | null;
  estimated_minutes: number | null;
  progress: number;
  tracking: RoadmapItemTrackingDto;
  started_at: string | null;
  completed_at: string | null;
}

/** `next_step` de `GET /roadmaps/:id` en el cable. `lesson` se ignora. */
export interface RoadmapNextStepDto {
  roadmap_item_id: string;
  name: string;
  url: string | null;
}

/**
 * `data` de `GET /roadmaps/:id` en el cable (snake_case). Solo campos consumidos: `generator`,
 * `courses`, `reason`, `details`, `syllabus`, `resume`, `progress_version` y `next_step.lesson`
 * se ignoran. Solo la usa el service (y las fixtures de test); la UI consume `RoadmapDetail`.
 */
export interface RoadmapDetailDto {
  id: string;
  name: string;
  summary: string;
  status: RoadmapStatus;
  progress: number;
  last_activity: string;
  paused_at: string | null;
  activity_version: number;
  content: RoadmapItemDto[];
  next_step: RoadmapNextStepDto | null;
}

export interface RoadmapItemTracking {
  type: RoadmapTrackingType;
  enabled: boolean;
  disabledReason: string | null;
}

export interface RoadmapItem {
  roadmapItemId: string;
  type: RoadmapItemType;
  order: number;
  courseId: string | null;
  name: string;
  description: string | null;
  image: string | null;
  url: string | null;
  level: RoadmapLevel | null;
  estimatedMinutes: number | null;
  /** 0-100, puede traer decimales (33.33). */
  progress: number;
  tracking: RoadmapItemTracking;
  startedAt: string | null;
  completedAt: string | null;
}

export interface RoadmapNextStep {
  roadmapItemId: string;
  name: string;
  url: string | null;
}

export interface RoadmapDetail {
  id: string;
  name: string;
  summary: string;
  status: RoadmapStatus;
  /** 0-100, puede traer decimales. */
  progress: number;
  lastActivity: string;
  pausedAt: string | null;
  activityVersion: number;
  /** Ordenados por `order`. */
  items: RoadmapItem[];
  nextStep: RoadmapNextStep | null;
}
