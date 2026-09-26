import type { AxiosError } from "axios";
import type { TrackProgressResponseDto, TrackProgressResult } from "@/types";
import { buildAxiosError } from "./api-errors";

// Fixture de tests: respuesta de `POST /progress/track` (cable y mapeada) y errores tipados del
// back. Solo se importa desde specs (import directo, sin barrel); ningún fichero de producción
// la usa. El mapeo snake→camel se escribe a mano por la misma razón que `roadmap-detail.ts`.

/** `data` de un 200: item-3 al 100 y la ruta r1 al 60 %, IN_PROGRESS. */
export function buildTrackProgressResponseDto(
  overrides: Partial<TrackProgressResponseDto> = {},
): TrackProgressResponseDto {
  return {
    roadmap_item_id: "item-3",
    progress: 100,
    completed: true,
    roadmap: {
      id: "r1",
      progress: 60,
      status: "IN_PROGRESS",
      last_activity: "2026-09-25T11:00:00.000Z",
      activity_version: 7,
    },
    ...overrides,
  };
}

/** `buildTrackProgressResponseDto()` mapeado a mano (= `toTrackProgressResult(...)`). */
export function buildTrackProgressResult(
  overrides: Partial<TrackProgressResult> = {},
): TrackProgressResult {
  return {
    roadmapItemId: "item-3",
    progress: 100,
    completed: true,
    roadmap: {
      id: "r1",
      progress: 60,
      status: "IN_PROGRESS",
      lastActivity: "2026-09-25T11:00:00.000Z",
      activityVersion: 7,
    },
    ...overrides,
  };
}

/** 409 `ROADMAP_PAUSED`: la ruta se pausó (p. ej. desde otra pestaña). */
export function buildRoadmapPausedError(): AxiosError {
  return buildAxiosError(409, "Roadmap is paused", { code: "ROADMAP_PAUSED" });
}

/** 404 `ROADMAP_ITEM_NOT_FOUND`: el paso (o su ruta) ya no existe. */
export function buildRoadmapItemNotFoundError(): AxiosError {
  return buildAxiosError(404, "Roadmap item not found", { code: "ROADMAP_ITEM_NOT_FOUND" });
}

/** 422 `TRACKING_REPORT_MISMATCH`: el tracking del paso ya no admite `{ completed: true }`. */
export function buildTrackingMismatchError(): AxiosError {
  return buildAxiosError(422, "Tracking report mismatch", { code: "TRACKING_REPORT_MISMATCH" });
}
