import type { RoadmapCounts, RoadmapStatus, RoadmapSummary } from "@/types";

/** Filtro de "Mis Rutas"; es el valor del query param `?status=` (ausente = "all"). */
export type RoadmapFilter = "all" | "in_progress" | "paused" | "completed";

export interface RoadmapFilterOption {
  value: RoadmapFilter;
  label: string;
  /** Estado que selecciona el filtro; `undefined` en "all". */
  status?: RoadmapStatus;
  countKey: keyof RoadmapCounts;
}

export const ROADMAP_STATUS_PARAM = "status";

export const ROADMAP_FILTERS: RoadmapFilterOption[] = [
  { value: "all", label: "Todas", countKey: "all" },
  { value: "in_progress", label: "Empezadas", status: "IN_PROGRESS", countKey: "inProgress" },
  { value: "paused", label: "En pausa", status: "PAUSED", countKey: "paused" },
  { value: "completed", label: "Completadas", status: "COMPLETED", countKey: "completed" },
];

/** Lee `?status=`: ausente, inválido o "not_started" (sin pestaña propia) → "all". */
export function parseRoadmapFilter(param: string | null): RoadmapFilter {
  const option = ROADMAP_FILTERS.find((filter) => filter.value === param);
  return option ? option.value : "all";
}

export function getRoadmapFilterStatus(filter: RoadmapFilter): RoadmapStatus | undefined {
  return ROADMAP_FILTERS.find((option) => option.value === filter)?.status;
}

/** Filtrado puro y síncrono en memoria; conserva el orden y no muta la entrada. */
export function filterRoadmaps(items: RoadmapSummary[], filter: RoadmapFilter): RoadmapSummary[] {
  const status = getRoadmapFilterStatus(filter);
  if (status === undefined) return [...items];
  return items.filter((roadmap) => roadmap.status === status);
}
