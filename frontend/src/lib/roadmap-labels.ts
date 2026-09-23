import type { RoadmapCounts, RoadmapLevel, RoadmapStatus } from "@/types";
import type { RoadmapFilter } from "./roadmap-filters";

export const ROADMAP_STATUS_LABELS: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "Empezada",
  PAUSED: "En pausa",
  COMPLETED: "Completada",
  NOT_STARTED: "Sin empezar",
};

export const ROADMAP_LEVEL_LABELS: Record<RoadmapLevel, string> = {
  beginner: "Básico",
  intermediate: "Intermedio",
  advanced: "Avanzado",
};

/** Texto del botón de acción de cada fila/card; todas navegan al detalle. */
export const ROADMAP_ACTION_LABELS: Record<RoadmapStatus, string> = {
  IN_PROGRESS: "Continuar",
  PAUSED: "Reanudar",
  COMPLETED: "Ver ruta",
  NOT_STARTED: "Empezar",
};

/** Mensaje cuando hay rutas pero ninguna del filtro activo ("all" nunca está vacío así). */
export const ROADMAP_FILTER_EMPTY_MESSAGES: Record<Exclude<RoadmapFilter, "all">, string> = {
  in_progress: "No tienes rutas empezadas.",
  paused: "No tienes rutas en pausa.",
  completed: "No tienes rutas completadas.",
};

function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

/** "7 cursos · Intermedio", "1 curso · Básico" o "3 cursos" si no hay nivel. */
export function getRoadmapCoursesSubtitle(
  totalCourses: number,
  level: RoadmapLevel | null,
): string {
  const courses = pluralize(totalCourses, "curso", "cursos");
  return level ? `${courses} · ${ROADMAP_LEVEL_LABELS[level]}` : courses;
}

/** "5 rutas · 2 en curso · 2 completadas" (counts globales, no dependen del filtro). */
export function getRoadmapsSummary(counts: RoadmapCounts): string {
  return [
    pluralize(counts.all, "ruta", "rutas"),
    `${counts.inProgress} en curso`,
    pluralize(counts.completed, "completada", "completadas"),
  ].join(" · ");
}
