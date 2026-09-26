import type { RoadmapStatus } from "./roadmaps";

/** Cuerpo de `POST /progress/track` para marcar un paso como completado (sin campos extra). */
export interface TrackItemCompletionBody {
  roadmap_item_id: string;
  completed: true;
}

/** `roadmap` de la respuesta de `POST /progress/track` en el cable. */
export interface TrackProgressRoadmapDto {
  id: string;
  progress: number;
  status: RoadmapStatus;
  last_activity: string;
  activity_version: number;
}

/**
 * `data` de `POST /progress/track` en el cable. Solo los campos consumidos: `status` (del ítem),
 * `progress_version`, `resume`, `lessons` y `submission` se ignoran.
 */
export interface TrackProgressResponseDto {
  roadmap_item_id: string;
  progress: number;
  completed: boolean;
  roadmap: TrackProgressRoadmapDto;
}

export interface TrackProgressRoadmap {
  id: string;
  progress: number;
  status: RoadmapStatus;
  lastActivity: string;
  activityVersion: number;
}

export interface TrackProgressResult {
  roadmapItemId: string;
  /** Progreso del ítem (0-100). */
  progress: number;
  completed: boolean;
  roadmap: TrackProgressRoadmap;
}
