import { ROADMAPS_MOCK } from "@/api/mocks/roadmaps";
import type { RoadmapCounts, RoadmapSummary, RoadmapSummaryDto, RoadmapsListResult } from "@/types";

// Fixture de tests: resultados de `getRoadmaps()` ya mapeados a camelCase.
// Solo se importa desde specs (import directo, sin barrel); ningún fichero de producción la usa.
// El mapeo snake→camel se replica aquí (no se importa `toRoadmapSummary` de `@/api/services`)
// porque los specs de página hacen `vi.mock("@/api/services", factory)` y el fixture recibiría
// el módulo mockeado. `roadmaps.service.spec.ts` comprueba que ambos mapeos coinciden.

function toSummary(dto: RoadmapSummaryDto): RoadmapSummary {
  return {
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
    ...(dto.monogram === undefined ? {} : { monogram: dto.monogram }),
    ...(dto.accent === undefined ? {} : { accent: dto.accent }),
  };
}

function countByStatus(items: RoadmapSummary[]): RoadmapCounts {
  const byStatus = (status: RoadmapSummary["status"]) =>
    items.filter((item) => item.status === status).length;
  return {
    all: items.length,
    notStarted: byStatus("NOT_STARTED"),
    inProgress: byStatus("IN_PROGRESS"),
    paused: byStatus("PAUSED"),
    completed: byStatus("COMPLETED"),
  };
}

export function buildRoadmapSummary(overrides: Partial<RoadmapSummary> = {}): RoadmapSummary {
  return {
    id: "rm-test",
    name: "Ruta de prueba",
    status: "IN_PROGRESS",
    progress: 50,
    lastActivity: "2026-09-20T10:00:00.000Z",
    pausedAt: null,
    activityVersion: 1,
    totalItems: 10,
    totalCourses: 3,
    level: "beginner",
    ...overrides,
  };
}

/** Resultado con `items` dados; `counts` se derivan de ellos salvo que se pasen. */
export function buildRoadmapsListResult({
  items = [],
  counts,
}: {
  items?: RoadmapSummary[];
  counts?: Partial<RoadmapCounts>;
} = {}): RoadmapsListResult {
  const total = items.length;
  return {
    items,
    meta: { total, page: 1, limit: 100, totalPages: total === 0 ? 0 : Math.ceil(total / 100) },
    counts: { ...countByStatus(items), ...counts },
  };
}

export const ROADMAPS_LIST_RESULT: RoadmapsListResult = buildRoadmapsListResult({
  items: ROADMAPS_MOCK.map(toSummary),
});

export const EMPTY_ROADMAPS_RESULT: RoadmapsListResult = buildRoadmapsListResult();
