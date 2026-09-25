import { apiClient, del, get } from "@/api/client";
import type {
  RoadmapDetail,
  RoadmapDetailDto,
  RoadmapItem,
  RoadmapItemDto,
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

/**
 * `DELETE /roadmaps/{id}`: borrado físico de la ruta (y su progreso y entregas). Resuelve con el
 * `data` desenvuelto (`{ id }`). Los errores (404 `ROADMAP_NOT_FOUND`, red…) se propagan tal cual;
 * el mapeo a copy es de la UI (`getDeleteRoadmapErrorMessage`).
 */
export function deleteRoadmap(id: string): Promise<{ id: string }> {
  return del<{ id: string }>(`/roadmaps/${encodeURIComponent(id)}`);
}

// Mapeo campo a campo explícito (nunca spread del DTO): así no se cuelan en el dominio los campos
// que el front ignora (`reason`, `details`, `syllabus`, `resume`, `progress_version`,
// `tracking.report_interval_seconds`…).
function toRoadmapItem(dto: RoadmapItemDto): RoadmapItem {
  return {
    roadmapItemId: dto.roadmap_item_id,
    type: dto.type,
    order: dto.order,
    courseId: dto.course_id,
    name: dto.name,
    description: dto.description,
    image: dto.image,
    url: dto.url,
    level: dto.level,
    estimatedMinutes: dto.estimated_minutes,
    progress: dto.progress,
    tracking: {
      type: dto.tracking.type,
      enabled: dto.tracking.enabled,
      disabledReason: dto.tracking.disabled_reason,
    },
    startedAt: dto.started_at,
    completedAt: dto.completed_at,
  };
}

/**
 * `data` de `GET /roadmaps/:id` → `RoadmapDetail` camelCase. Ordena los ítems por `order` (sobre
 * una copia: el DTO no se muta) y descarta `generator`, `courses`, `reason` y `next_step.lesson`.
 */
export function toRoadmapDetail(dto: RoadmapDetailDto): RoadmapDetail {
  return {
    id: dto.id,
    name: dto.name,
    summary: dto.summary,
    status: dto.status,
    progress: dto.progress,
    lastActivity: dto.last_activity,
    pausedAt: dto.paused_at,
    activityVersion: dto.activity_version,
    items: [...dto.content].sort((a, b) => a.order - b.order).map(toRoadmapItem),
    nextStep:
      dto.next_step === null
        ? null
        : {
            roadmapItemId: dto.next_step.roadmap_item_id,
            name: dto.next_step.name,
            url: dto.next_step.url,
          },
  };
}

/**
 * `GET /roadmaps/{id}`: detalle de una ruta del usuario. `get` sí vale (la respuesta es `{ data }`
 * sin `meta`). Los errores (404 `ROADMAP_NOT_FOUND` para inexistente/mal formado/ajeno, red…) se
 * propagan tal cual.
 */
export async function getRoadmap(id: string): Promise<RoadmapDetail> {
  return toRoadmapDetail(await get<RoadmapDetailDto>(`/roadmaps/${encodeURIComponent(id)}`));
}
