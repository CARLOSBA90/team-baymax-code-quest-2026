import type { RoadmapDetail, RoadmapDetailDto, RoadmapItem } from "@/types";

// Fixture de tests: respuesta de `GET /roadmaps/:id` en el cable (snake_case) y resultado de
// `getRoadmap()` ya mapeado a camelCase.
// Solo se importa desde specs (import directo, sin barrel); ningún fichero de producción la usa.
// El mapeo snake→camel se escribe a mano (no se importa `toRoadmapDetail` de `@/api/services`)
// porque los specs de página hacen `vi.mock("@/api/services", factory)` y el fixture recibiría
// el módulo mockeado. `roadmaps.service.spec.ts` comprueba que ambos coinciden.

/**
 * Ruta en curso con 4 pasos: #1 curso completado, #2 curso empezado (= `next_step`), #3 media
 * pendiente sin duración, #4 reto pendiente con el seguimiento deshabilitado.
 */
export const ROADMAP_DETAIL_DTO: RoadmapDetailDto = {
  id: "rm-frontend-react",
  name: "Frontend moderno con React",
  summary: "Aprende a construir interfaces modernas con React, TypeScript y buenas prácticas.",
  status: "IN_PROGRESS",
  progress: 33.33,
  last_activity: "2026-09-21T18:30:00.000Z",
  paused_at: null,
  activity_version: 12,
  content: [
    {
      roadmap_item_id: "item-1",
      type: "COURSE",
      order: 1,
      course_id: "course-js-basics",
      name: "Fundamentos de JavaScript",
      description: "Variables, funciones y control de flujo.",
      image: "https://cdn.example.com/courses/js-basics.png",
      url: "https://example.com/courses/js-basics",
      level: "beginner",
      estimated_minutes: 120,
      progress: 100,
      tracking: { type: "LESSONS", enabled: true, disabled_reason: null },
      started_at: "2026-09-10T09:00:00.000Z",
      completed_at: "2026-09-15T17:00:00.000Z",
    },
    {
      roadmap_item_id: "item-2",
      type: "COURSE",
      order: 2,
      course_id: "course-react-intro",
      name: "Introducción a React",
      description: "Componentes, props y estado.",
      image: "https://cdn.example.com/courses/react-intro.png",
      url: "https://example.com/courses/react-intro",
      level: "intermediate",
      estimated_minutes: 180,
      progress: 40,
      tracking: { type: "VIDEO", enabled: true, disabled_reason: null },
      started_at: "2026-09-18T10:00:00.000Z",
      completed_at: null,
    },
    {
      roadmap_item_id: "item-3",
      type: "MEDIA",
      order: 3,
      course_id: null,
      name: "Guía de hooks de React",
      description: null,
      image: null,
      url: "https://react.dev/reference/react/hooks",
      level: null,
      estimated_minutes: null,
      progress: 0,
      tracking: { type: "READING", enabled: true, disabled_reason: null },
      started_at: null,
      completed_at: null,
    },
    {
      roadmap_item_id: "item-4",
      type: "CHALLENGE",
      order: 4,
      course_id: null,
      name: "Reto: lista de tareas con React",
      description: "Construye una app de tareas con filtros.",
      image: null,
      url: null,
      level: "intermediate",
      estimated_minutes: 90,
      progress: 0,
      tracking: {
        type: "CHALLENGE",
        enabled: false,
        disabled_reason: "TRACKING_METADATA_MISSING",
      },
      started_at: null,
      completed_at: null,
    },
  ],
  next_step: {
    roadmap_item_id: "item-2",
    name: "Introducción a React",
    url: "https://example.com/courses/react-intro",
  },
};

export function buildRoadmapDetailDto(overrides: Partial<RoadmapDetailDto> = {}): RoadmapDetailDto {
  return { ...structuredClone(ROADMAP_DETAIL_DTO), ...overrides };
}

/** `ROADMAP_DETAIL_DTO` mapeado a mano a camelCase (= `toRoadmapDetail(ROADMAP_DETAIL_DTO)`). */
export const ROADMAP_DETAIL: RoadmapDetail = {
  id: "rm-frontend-react",
  name: "Frontend moderno con React",
  summary: "Aprende a construir interfaces modernas con React, TypeScript y buenas prácticas.",
  status: "IN_PROGRESS",
  progress: 33.33,
  lastActivity: "2026-09-21T18:30:00.000Z",
  pausedAt: null,
  activityVersion: 12,
  items: [
    {
      roadmapItemId: "item-1",
      type: "COURSE",
      order: 1,
      courseId: "course-js-basics",
      name: "Fundamentos de JavaScript",
      description: "Variables, funciones y control de flujo.",
      image: "https://cdn.example.com/courses/js-basics.png",
      url: "https://example.com/courses/js-basics",
      level: "beginner",
      estimatedMinutes: 120,
      progress: 100,
      tracking: { type: "LESSONS", enabled: true, disabledReason: null },
      startedAt: "2026-09-10T09:00:00.000Z",
      completedAt: "2026-09-15T17:00:00.000Z",
    },
    {
      roadmapItemId: "item-2",
      type: "COURSE",
      order: 2,
      courseId: "course-react-intro",
      name: "Introducción a React",
      description: "Componentes, props y estado.",
      image: "https://cdn.example.com/courses/react-intro.png",
      url: "https://example.com/courses/react-intro",
      level: "intermediate",
      estimatedMinutes: 180,
      progress: 40,
      tracking: { type: "VIDEO", enabled: true, disabledReason: null },
      startedAt: "2026-09-18T10:00:00.000Z",
      completedAt: null,
    },
    {
      roadmapItemId: "item-3",
      type: "MEDIA",
      order: 3,
      courseId: null,
      name: "Guía de hooks de React",
      description: null,
      image: null,
      url: "https://react.dev/reference/react/hooks",
      level: null,
      estimatedMinutes: null,
      progress: 0,
      tracking: { type: "READING", enabled: true, disabledReason: null },
      startedAt: null,
      completedAt: null,
    },
    {
      roadmapItemId: "item-4",
      type: "CHALLENGE",
      order: 4,
      courseId: null,
      name: "Reto: lista de tareas con React",
      description: "Construye una app de tareas con filtros.",
      image: null,
      url: null,
      level: "intermediate",
      estimatedMinutes: 90,
      progress: 0,
      tracking: {
        type: "CHALLENGE",
        enabled: false,
        disabledReason: "TRACKING_METADATA_MISSING",
      },
      startedAt: null,
      completedAt: null,
    },
  ],
  nextStep: {
    roadmapItemId: "item-2",
    name: "Introducción a React",
    url: "https://example.com/courses/react-intro",
  },
};

export function buildRoadmapDetail(overrides: Partial<RoadmapDetail> = {}): RoadmapDetail {
  return { ...structuredClone(ROADMAP_DETAIL), ...overrides };
}

/** Paso pendiente genérico (curso sin empezar, seguimiento por compleción habilitado). */
export function buildRoadmapItem(overrides: Partial<RoadmapItem> = {}): RoadmapItem {
  return {
    roadmapItemId: "item-test",
    type: "COURSE",
    order: 1,
    courseId: "course-test",
    name: "Paso de prueba",
    description: null,
    image: null,
    url: null,
    level: null,
    estimatedMinutes: 60,
    progress: 0,
    tracking: { type: "COMPLETION", enabled: true, disabledReason: null },
    startedAt: null,
    completedAt: null,
    ...overrides,
  };
}

/**
 * `ROADMAP_DETAIL` sin empezar: NOT_STARTED, progreso 0, ningún ítem empezado ni completado y el
 * siguiente paso apunta al ítem 1.
 */
export function buildNotStartedRoadmapDetail(): RoadmapDetail {
  const base = buildRoadmapDetail();
  const [first] = base.items;
  return {
    ...base,
    status: "NOT_STARTED",
    progress: 0,
    items: base.items.map((item) => ({ ...item, progress: 0, startedAt: null, completedAt: null })),
    nextStep: { roadmapItemId: first.roadmapItemId, name: first.name, url: first.url },
  };
}

/** `ROADMAP_DETAIL` en pausa desde el 3 de septiembre de 2026; ítems y siguiente paso intactos. */
export function buildPausedRoadmapDetail(): RoadmapDetail {
  return buildRoadmapDetail({ status: "PAUSED", pausedAt: "2026-09-03T12:00:00.000Z" });
}

/**
 * `ROADMAP_DETAIL` completada: COMPLETED, progreso 100, todos los ítems al 100 % con
 * `startedAt`/`completedAt` y sin siguiente paso.
 */
export function buildCompletedRoadmapDetail(): RoadmapDetail {
  const base = buildRoadmapDetail();
  return {
    ...base,
    status: "COMPLETED",
    progress: 100,
    items: base.items.map((item) => ({
      ...item,
      progress: 100,
      startedAt: item.startedAt ?? "2026-09-12T09:00:00.000Z",
      completedAt: item.completedAt ?? "2026-09-20T17:00:00.000Z",
    })),
    nextStep: null,
  };
}
