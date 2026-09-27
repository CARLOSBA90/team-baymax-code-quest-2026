import type { AxiosError } from "axios";
import type { RoadmapDetail, RoadmapDetailDto } from "@/types";
import { buildAxiosError } from "./api-errors";
import { buildRoadmapDetail, buildRoadmapDetailDto } from "./roadmap-detail";

// Fixture de tests de `PATCH /roadmaps/:id/pause`: errores tipados del back y respuestas 200 (cable
// y mapeadas). Solo se importa desde specs (import directo, sin barrel); ningún fichero de
// producción la usa. El mapeo snake→camel se escribe a mano por la misma razón que
// `roadmap-detail.ts` (los specs de página mockean `@/api/services`).

/** `pausedAt` de las respuestas de pausa de esta fixture. */
export const PAUSED_AT = "2026-09-25T11:30:00.000Z";

/** 409 `ROADMAP_VERSION_CONFLICT`: `expectedActivityVersion` desfasado (cambió en otro sitio). */
export function buildRoadmapVersionConflictError(): AxiosError {
  return buildAxiosError(409, "Roadmap version conflict", { code: "ROADMAP_VERSION_CONFLICT" });
}

/** 409 `INVALID_ROADMAP_TRANSITION`: p. ej. pausar una ruta ya COMPLETED. */
export function buildInvalidRoadmapTransitionError(): AxiosError {
  return buildAxiosError(409, "Invalid roadmap transition", {
    code: "INVALID_ROADMAP_TRANSITION",
  });
}

/** 404 `ROADMAP_NOT_FOUND`: la ruta ya no existe (o no es del usuario). */
export function buildRoadmapNotFoundError(): AxiosError {
  return buildAxiosError(404, "Roadmap not found.", { code: "ROADMAP_NOT_FOUND" });
}

/**
 * `data` de un 200 de pausa en el cable: `ROADMAP_DETAIL_DTO` en PAUSED con `paused_at`,
 * `activity_version` 8, el `content` desordenado y campos que el front descarta (`reason`,
 * `courses`). Mapeado = `buildPausedRoadmapDetailResult()`.
 */
export function buildPausedRoadmapDetailDto(): RoadmapDetailDto {
  const base = buildRoadmapDetailDto();
  const [first, second, third, fourth] = base.content;
  return {
    ...base,
    status: "PAUSED",
    paused_at: PAUSED_AT,
    activity_version: 8,
    content: [third, first, fourth, second],
    reason: "Recommended because…",
    courses: [{ id: "c1" }],
  } as RoadmapDetailDto;
}

/** `buildPausedRoadmapDetailDto()` mapeado a mano (= `toRoadmapDetail(...)`). */
export function buildPausedRoadmapDetailResult(): RoadmapDetail {
  return buildRoadmapDetail({ status: "PAUSED", pausedAt: PAUSED_AT, activityVersion: 8 });
}

/** Respuesta 200 de reanudar (camelCase): IN_PROGRESS, sin `pausedAt`, `activityVersion` 9. */
export function buildResumedRoadmapDetail(): RoadmapDetail {
  return buildRoadmapDetail({ status: "IN_PROGRESS", pausedAt: null, activityVersion: 9 });
}
