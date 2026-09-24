import type { RoadmapAccent, RoadmapSummary } from "@/types";
import { getInitials } from "./user-initials";

export type RoadmapMonogramAccent = RoadmapAccent | "neutral";

/** Monograma del backend o, si no llega, iniciales del nombre (máx. 2 mayúsculas). */
export function getRoadmapMonogram(roadmap: Pick<RoadmapSummary, "name" | "monogram">): string {
  return roadmap.monogram ?? getInitials(roadmap.name);
}

export function getRoadmapAccent(roadmap: Pick<RoadmapSummary, "accent">): RoadmapMonogramAccent {
  return roadmap.accent ?? "neutral";
}

export function getRoadmapPath(id: string): string {
  return `/dashboard/roadmaps/${encodeURIComponent(id)}`;
}

/** Progreso entero entre 0 y 100. */
export function clampProgress(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.min(100, Math.max(0, Math.round(value)));
}
