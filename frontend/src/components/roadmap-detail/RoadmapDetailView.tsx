import { Link } from "react-router-dom";
import { RoadmapProgressBar, RoadmapStatusBadge } from "@/components/roadmaps";
import { getCompletedCount, getRoadmapStepsProgressLabel } from "@/lib";
import type { RoadmapDetail } from "@/types";

export interface RoadmapDetailViewProps {
  roadmap: RoadmapDetail;
}

/** Vista mínima del detalle: cabecera, progreso y lista ordenada de pasos (sin acciones). */
export function RoadmapDetailView({ roadmap }: RoadmapDetailViewProps) {
  const { items } = roadmap;

  return (
    <>
      <Link
        to="/dashboard/roadmaps"
        className="flex w-fit items-center gap-1.5 rounded-md font-body font-semibold text-sm text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:shadow-ring-focus"
      >
        <span aria-hidden="true">‹</span>
        Mis Rutas
      </Link>
      <header className="flex flex-col items-start gap-3">
        <h1 className="font-display text-4xl font-bold text-text-primary">{roadmap.name}</h1>
        <p className="text-text-secondary">{roadmap.summary}</p>
        <RoadmapStatusBadge status={roadmap.status} />
      </header>
      <div className="flex flex-col gap-3 rounded-card border border-border-field bg-bg-ghost p-5">
        <RoadmapProgressBar
          value={roadmap.progress}
          status={roadmap.status}
          roadmapName={roadmap.name}
        />
        <p className="font-body text-sm text-text-secondary">
          {getRoadmapStepsProgressLabel(getCompletedCount(items), items.length)}
        </p>
      </div>
      <ol aria-label="Pasos de la ruta" className="flex flex-col gap-3">
        {items.map((item) => (
          <li
            key={item.roadmapItemId}
            className="rounded-card border border-border-field bg-bg-ghost px-4 py-4 text-text-primary"
          >
            {item.name}
          </li>
        ))}
      </ol>
    </>
  );
}
