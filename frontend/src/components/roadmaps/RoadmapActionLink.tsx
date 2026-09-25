import { Link } from "react-router-dom";
import { getRoadmapPath, ROADMAP_ACTION_LABELS } from "@/lib";
import type { RoadmapSummary } from "@/types";

export interface RoadmapActionLinkProps {
  roadmap: Pick<RoadmapSummary, "id" | "name" | "status">;
}

/** Acción de la fila: todas (incl. "Reanudar") solo navegan al detalle de la ruta. */
export function RoadmapActionLink({ roadmap }: RoadmapActionLinkProps) {
  return (
    <Link
      to={getRoadmapPath(roadmap.id)}
      className="inline-flex h-10 items-center justify-center whitespace-nowrap rounded-xl border border-border-ghost bg-bg-ghost px-4 font-body font-semibold text-sm text-text-primary outline-none transition-[background-color,border-color,box-shadow] duration-150 hover:border-border-ghost-hover hover:bg-bg-ghost-hover focus-visible:border-accent-hover focus-visible:shadow-ring-focus"
    >
      {ROADMAP_ACTION_LABELS[roadmap.status]} <span className="sr-only">{roadmap.name}</span>
    </Link>
  );
}
