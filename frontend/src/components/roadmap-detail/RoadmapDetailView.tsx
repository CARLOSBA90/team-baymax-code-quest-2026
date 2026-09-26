import { useId } from "react";
import { Link } from "react-router-dom";
import { getCompletedCount, getNextStepItem, getRemainingMinutes, getTotalMinutes } from "@/lib";
import type { RoadmapDetail } from "@/types";
import { NextStepCard } from "./NextStepCard";
import { PausedBanner } from "./PausedBanner";
import { RoadmapCompletedPanel } from "./RoadmapCompletedPanel";
import { RoadmapHeader } from "./RoadmapHeader";
import { RoadmapProgress } from "./RoadmapProgress";
import { RoadmapTimeline } from "./RoadmapTimeline";

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
  const pausedDescriptionId = useId();
  const isPaused = roadmap.status === "PAUSED";
  const completed = getCompletedCount(items);
  const total = items.length;
  const totalMinutes = getTotalMinutes(items);
  const remainingMinutes = getRemainingMinutes(items);
  // NOT_STARTED se trata como en curso (#224 Q2); PAUSED y COMPLETED no muestran la tarjeta.
  const showsNextStep = roadmap.status === "IN_PROGRESS" || roadmap.status === "NOT_STARTED";
  const nextStepItem = showsNextStep ? getNextStepItem(items, roadmap.nextStep) : null;

  return (
    <div className="flex w-full max-w-detail flex-col gap-5.5">
      <Link
        to="/dashboard/roadmaps"
        className="flex w-fit items-center gap-1.5 rounded-md font-body font-semibold text-sm text-text-secondary outline-none transition-colors hover:text-text-primary focus-visible:shadow-ring-focus"
      >
        <span aria-hidden="true">‹</span>
        Mis Rutas
      </Link>
      <RoadmapHeader
        name={roadmap.name}
        summary={roadmap.summary}
        status={roadmap.status}
        lastActivity={roadmap.lastActivity}
        headingId={headingId}
      />
      <RoadmapProgress
        progress={roadmap.progress}
        status={roadmap.status}
        completed={completed}
        total={total}
        totalMinutes={totalMinutes}
        remainingMinutes={remainingMinutes}
        labelledBy={headingId}
      />
      {isPaused ? (
        <PausedBanner pausedAt={roadmap.pausedAt} descriptionId={pausedDescriptionId} />
      ) : null}
      {roadmap.status === "COMPLETED" ? (
        <RoadmapCompletedPanel total={total} totalMinutes={totalMinutes} />
      ) : null}
      {nextStepItem ? (
        <NextStepCard item={nextStepItem.item} stepNumber={nextStepItem.stepNumber} total={total} />
      ) : null}
      <RoadmapTimeline
        items={items}
        nextStepId={roadmap.nextStep?.roadmapItemId ?? null}
        completed={completed}
        isPaused={isPaused}
        pausedDescriptionId={isPaused ? pausedDescriptionId : undefined}
      />
    </div>
  );
}
