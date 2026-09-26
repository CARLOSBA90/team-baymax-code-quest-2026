import type {
  RoadmapCounts,
  RoadmapDetail,
  RoadmapStatus,
  RoadmapsListResult,
  TrackProgressResult,
} from "@/types";

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
 * Parche del detalle cacheado con la respuesta de `POST /progress/track` (datos del servidor, no
 * optimista); solo se usa si el refetch del detalle tras un 200 falla. El ítem toma el `progress`
 * de la respuesta y, si queda completado sin `completedAt`, `lastActivity` de la ruta (el POST no
 * trae `completed_at`); la ruta toma `progress`/`status`/`lastActivity`/`activityVersion`,
 * `pausedAt` pasa a `null` si queda COMPLETED y `nextStep` a `null` si apuntaba al ítem (el
 * siguiente no se puede calcular aquí). Ítem ausente → solo campos de ruta. Nunca muta `detail`.
 */
export function applyTrackProgressResult(
  detail: RoadmapDetail,
  roadmapItemId: string,
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
    items: detail.items.map((item) =>
      item.roadmapItemId === roadmapItemId
        ? {
            ...item,
            progress: result.progress,
            completedAt: item.completedAt ?? (result.completed ? roadmap.lastActivity : null),
          }
        : item,
    ),
    nextStep: detail.nextStep?.roadmapItemId === roadmapItemId ? null : detail.nextStep,
  };
}
