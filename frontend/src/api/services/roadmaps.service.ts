import { apiClient } from "@/api/client";
import type {
  RoadmapSummary,
  RoadmapSummaryDto,
  RoadmapsListResponseDto,
  RoadmapsListResult,
} from "@/types";

/**
 * Tamaño de página pedido a `GET /roadmaps` (= `MAX_PAGE_SIZE` del backend, no puede superarlo:
 * responde 400). Se piden todas las rutas de una vez (solo la página 1) y se filtran en memoria.
 */
export const ROADMAPS_LIST_LIMIT = 100;

export function toRoadmapSummary(dto: RoadmapSummaryDto): RoadmapSummary {
  const summary: RoadmapSummary = {
    id: dto.id,
    name: dto.name,
    status: dto.status,
    progress: dto.progress,
    lastActivity: dto.last_activity,
    pausedAt: dto.paused_at,
    activityVersion: dto.activity_version,
    totalItems: dto.total_items,
    totalCourses: dto.total_courses,
    level: dto.level,
  };
  if (dto.monogram !== undefined) summary.monogram = dto.monogram;
  if (dto.accent !== undefined) summary.accent = dto.accent;
  return summary;
}

function toRoadmapsListResult(response: RoadmapsListResponseDto): RoadmapsListResult {
  return {
    items: response.data.map(toRoadmapSummary),
    meta: { ...response.meta },
    counts: { ...response.counts },
  };
}

/**
 * Todas las rutas del usuario (+ counts globales y meta). El filtrado por estado se hace en
 * memoria (`filterRoadmaps`), así que no recibe parámetros.
 */
export async function getRoadmaps(): Promise<RoadmapsListResult> {
  // `apiClient.get` y no `get`/`getPage` de `@/api/client`: esos desenvuelven `data` y
  // perderían `meta` y `counts`, que la respuesta trae al mismo nivel.
  const response = await apiClient.get<RoadmapsListResponseDto>("/roadmaps", {
    params: { limit: ROADMAPS_LIST_LIMIT },
  });
  return toRoadmapsListResult(response.data);
}
