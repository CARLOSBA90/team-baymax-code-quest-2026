import { useId } from "react";
import { Link } from "react-router-dom";
import { RoadmapStatusBadge } from "@/components/roadmaps";
import { getCompletedCount, getRemainingMinutes, getTotalMinutes } from "@/lib";
import type { RoadmapDetail } from "@/types";
import { RoadmapProgress } from "./RoadmapProgress";

export interface RoadmapDetailViewProps {
  roadmap: RoadmapDetail;
}

/**
 * Compositor del detalle: calcula una vez los derivados (pasos, minutos, ids de a11y) y los baja
 * a piezas presentacionales dentro de la columna de 920px.
 */
export function RoadmapDetailView({ roadmap }: RoadmapDetailViewProps) {
  const { items } = roadmap;
  const headingId = useId();
  const completed = getCompletedCount(items);
  const total = items.length;
  const totalMinutes = getTotalMinutes(items);
  const remainingMinutes = getRemainingMinutes(items);

  return (
    <div className="flex w-full max-w-detail flex-col gap-5.5">
      <Link
        to="/dashboard/roadmaps"
        className="flex w-fit items-center gap-1.5 rounded-md font-body font-semibold text-sm text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:shadow-ring-focus"
      >
        <span aria-hidden="true">‹</span>
        Mis Rutas
      </Link>
      <header className="flex flex-col items-start gap-3">
        <h1 id={headingId} className="font-display text-4xl font-bold text-text-primary">
          {roadmap.name}
        </h1>
        <p className="text-text-secondary">{roadmap.summary}</p>
        <RoadmapStatusBadge status={roadmap.status} />
      </header>
      <RoadmapProgress
        progress={roadmap.progress}
        status={roadmap.status}
        completed={completed}
        total={total}
        totalMinutes={totalMinutes}
        remainingMinutes={remainingMinutes}
        labelledBy={headingId}
      />
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
    </div>
  );
}
