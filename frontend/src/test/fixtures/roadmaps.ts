import type {
  RoadmapCounts,
  RoadmapSummary,
  RoadmapSummaryDto,
  RoadmapsListResponseDto,
  RoadmapsListResult,
} from "@/types";

// Fixture de tests: respuestas de `GET /roadmaps` en el cable (snake_case) y resultados de
// `getRoadmaps()` ya mapeados a camelCase.
// Solo se importa desde specs (import directo, sin barrel); ningún fichero de producción la usa.
// El mapeo snake→camel se replica aquí (no se importa `toRoadmapSummary` de `@/api/services`)
// porque los specs de página hacen `vi.mock("@/api/services", factory)` y el fixture recibiría
// el módulo mockeado. `roadmaps.service.spec.ts` comprueba que ambos mapeos coinciden.

/**
 * Las 5 rutas del artboard "Mis Rutas" tal como las serializa `GET /roadmaps` (snake_case).
 * `monogram`/`accent` son opcionales: el backend aún no los envía (ver `toRoadmapSummary`).
 */
export const ROADMAP_SUMMARY_DTOS: RoadmapSummaryDto[] = [
  {
    id: "rm-frontend-react",
    name: "Frontend moderno con React",
    status: "IN_PROGRESS",
    progress: 42,
    last_activity: "2026-09-21T18:30:00.000Z",
    paused_at: null,
    activity_version: 12,
    total_items: 24,
    total_courses: 7,
    level: "intermediate",
    monogram: "FE",
    accent: "violet",
  },
  {
    id: "rm-backend-nest",
    name: "Backend con Node y NestJS",
    status: "PAUSED",
    progress: 18,
    last_activity: "2026-09-02T10:15:00.000Z",
    paused_at: "2026-09-02T10:15:00.000Z",
    activity_version: 5,
    total_items: 20,
    total_courses: 6,
    level: "advanced",
    monogram: "BE",
    accent: "cyan",
  },
  {
    id: "rm-js-ts",
    name: "Fundamentos de JavaScript y TypeScript",
    status: "COMPLETED",
    progress: 100,
    last_activity: "2026-08-28T16:45:00.000Z",
    paused_at: null,
    activity_version: 18,
    total_items: 14,
    total_courses: 4,
    level: "beginner",
    monogram: "JS",
    accent: "amber",
  },
  {
    id: "rm-flutter",
    name: "Apps móviles con Flutter",
    status: "IN_PROGRESS",
    progress: 8,
    last_activity: "2026-09-19T09:00:00.000Z",
    paused_at: null,
    activity_version: 2,
    total_items: 18,
    total_courses: 5,
    level: "intermediate",
    monogram: "MO",
    accent: "pink",
  },
  {
    id: "rm-devops",
    name: "Git, Docker y despliegue",
    status: "COMPLETED",
    progress: 100,
    last_activity: "2026-08-10T12:00:00.000Z",
    paused_at: null,
    activity_version: 9,
    total_items: 10,
    total_courses: 3,
    level: "beginner",
    monogram: "DO",
    accent: "emerald",
  },
];

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
  items: ROADMAP_SUMMARY_DTOS.map(toSummary),
});

/** Cuerpo de `GET /roadmaps?limit=100` equivalente a `ROADMAPS_LIST_RESULT`. */
export function buildRoadmapsListResponseDto(
  data: RoadmapSummaryDto[] = ROADMAP_SUMMARY_DTOS,
): RoadmapsListResponseDto {
  const { meta, counts } = buildRoadmapsListResult({ items: data.map(toSummary) });
  return { data: structuredClone(data), meta, counts };
}

export const EMPTY_ROADMAPS_RESULT: RoadmapsListResult = buildRoadmapsListResult();
