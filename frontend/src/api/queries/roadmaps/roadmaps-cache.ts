import type { RoadmapCounts, RoadmapStatus, RoadmapsListResult } from "@/types";

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
