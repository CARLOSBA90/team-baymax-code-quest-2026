import type {
  RoadmapCounts,
  RoadmapDetail,
  RoadmapStatus,
  RoadmapsListResult,
  Syllabus,
  TrackProgressResult,
} from "@/types";
import type { TrackProgressVariables } from "./useTrackProgress";

const STATUS_COUNT_KEY: Record<RoadmapStatus, keyof Omit<RoadmapCounts, "all">> = {
  NOT_STARTED: "notStarted",
  IN_PROGRESS: "inProgress",
  PAUSED: "paused",
  COMPLETED: "completed",
};

function decrement(value: number): number {
  return Math.max(0, value - 1);
}

/**
 * Quita la ruta `id` del listado cacheado y descuenta `counts.all`, el contador de su estado y
 * `meta.total` (nunca por debajo de 0). `meta.totalPages` no se recalcula: la invalidación
 * posterior trae los valores del back. Si la ruta no está, devuelve `result` tal cual.
 */
export function removeRoadmapFromList(result: RoadmapsListResult, id: string): RoadmapsListResult {
  const removed = result.items.find((item) => item.id === id);
  if (!removed) return result;

  const countKey = STATUS_COUNT_KEY[removed.status];
  return {
    items: result.items.filter((item) => item.id !== id),
    meta: { ...result.meta, total: decrement(result.meta.total) },
    counts: {
      ...result.counts,
      all: decrement(result.counts.all),
      [countKey]: decrement(result.counts[countKey]),
    },
  };
}

/**
 * Parchea un `Syllabus` marcando/desmarcando `lessonId` (copia inmutable, nunca muta `syllabus`) y
 * recalcula `completedLessons` contando las lecciones `completed` tras el parche (el 200 confirma
 * que `completed` se aplicó; no hace falta leer el resumen `lessons` de la respuesta).
 */
function patchSyllabusLesson(syllabus: Syllabus, lessonId: string, completed: boolean): Syllabus {
  const sections = syllabus.sections.map((section) => ({
    ...section,
    lessons: section.lessons.map((lesson) =>
      lesson.lessonId === lessonId ? { ...lesson, completed } : lesson,
    ),
  }));
  const completedLessons = sections.reduce(
    (total, section) => total + section.lessons.filter((lesson) => lesson.completed).length,
    0,
  );
  return { ...syllabus, sections, completedLessons };
}

/**
 * Marca TODAS las lecciones del temario (copia inmutable) para el atajo bulk: un `kind: "item"`
 * sobre un ítem con temario significa «marcar el curso entero», y el back deja las lecciones
 * completas. `completedLessons` toma `totalLessons` —el total del propio servidor— en vez de
 * contar las filas, para que la etiqueta «N de N lecciones» no se contradiga con el ítem al 100 %.
 */
function markAllLessons(syllabus: Syllabus): Syllabus {
  return {
    ...syllabus,
    completedLessons: syllabus.totalLessons,
    nextLesson: null,
    sections: syllabus.sections.map((section) => ({
      ...section,
      lessons: section.lessons.map((lesson) =>
        lesson.completed ? lesson : { ...lesson, completed: true },
      ),
    })),
  };
}

/**
 * Parche del detalle cacheado con la respuesta de `POST /progress/track` (datos del servidor, no
 * optimista); solo se usa si el refetch del detalle tras un 200 falla. El ítem toma el `progress`
 * de la respuesta y, si queda completado sin `completedAt`, `lastActivity` de la ruta (el POST no
 * trae `completed_at`); la ruta toma `progress`/`status`/`lastActivity`/`activityVersion`,
 * `pausedAt` pasa a `null` si queda COMPLETED y `nextStep` a `null` si apuntaba al ítem (el
 * siguiente no se puede calcular aquí). Con `syllabus` presente en el ítem además parchea el
 * temario: `kind: "lesson"` marca/desmarca esa lección (`patchSyllabusLesson`) y `kind: "item"`
 * —el atajo bulk— marca todas (`markAllLessons`), para que el checklist no quede en «0 de 151»
 * con el ítem al 100 %. Ítem ausente → solo campos de ruta. Nunca muta `detail`.
 */
export function applyTrackProgressResult(
  detail: RoadmapDetail,
  variables: TrackProgressVariables,
  result: TrackProgressResult,
): RoadmapDetail {
  const { roadmap } = result;
  return {
    ...detail,
    progress: roadmap.progress,
    status: roadmap.status,
    lastActivity: roadmap.lastActivity,
    activityVersion: roadmap.activityVersion,
    pausedAt: roadmap.status === "COMPLETED" ? null : detail.pausedAt,
    items: detail.items.map((item) => {
      if (item.roadmapItemId !== variables.roadmapItemId) return item;
      const syllabus = item.syllabus
        ? variables.kind === "lesson"
          ? patchSyllabusLesson(item.syllabus, variables.lessonId, variables.completed)
          : markAllLessons(item.syllabus)
        : item.syllabus;
      return {
        ...item,
        progress: result.progress,
        completedAt: item.completedAt ?? (result.completed ? roadmap.lastActivity : null),
        syllabus,
      };
    }),
    nextStep: detail.nextStep?.roadmapItemId === variables.roadmapItemId ? null : detail.nextStep,
  };
}
