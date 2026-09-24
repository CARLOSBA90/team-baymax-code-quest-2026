import { ROADMAPS_MOCK, ROADMAPS_MOCK_LATENCY_MS } from "@/api/mocks/roadmaps";
import type {
  RoadmapCounts,
  RoadmapSummary,
  RoadmapSummaryDto,
  RoadmapsListResponseDto,
  RoadmapsListResult,
} from "@/types";

/** Tamaño de página pedido al backend (= MAX_PAGE_SIZE). Se traen todas las rutas de una vez. */
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

function countRoadmaps(roadmaps: RoadmapSummaryDto[]): RoadmapCounts {
  const byStatus = (status: RoadmapSummaryDto["status"]) =>
    roadmaps.filter((roadmap) => roadmap.status === status).length;
  return {
    all: roadmaps.length,
    notStarted: byStatus("NOT_STARTED"),
    inProgress: byStatus("IN_PROGRESS"),
    paused: byStatus("PAUSED"),
    completed: byStatus("COMPLETED"),
  };
}

function buildMockResponse(): RoadmapsListResponseDto {
  const total = ROADMAPS_MOCK.length;
  return {
    data: ROADMAPS_MOCK,
    meta: {
      total,
      page: 1,
      limit: ROADMAPS_LIST_LIMIT,
      totalPages: total === 0 ? 0 : Math.ceil(total / ROADMAPS_LIST_LIMIT),
    },
    counts: countRoadmaps(ROADMAPS_MOCK),
  };
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Todas las rutas del usuario (+ counts globales y meta). El filtrado por estado se hace en
 * memoria (`filterRoadmaps`), así que no recibe parámetros.
 */
export async function getRoadmaps(): Promise<RoadmapsListResult> {
  // TEMPORAL (mock): sustituir por la llamada real y borrar `src/api/mocks/`:
  //   const response = await apiClient.get<RoadmapsListResponseDto>("/roadmaps", {
  //     params: { limit: ROADMAPS_LIST_LIMIT },
  //   });
  //   return toRoadmapsListResult(response.data);
  await delay(ROADMAPS_MOCK_LATENCY_MS);
  return toRoadmapsListResult(buildMockResponse());
}
