import { useId } from "react";
import { Link } from "react-router-dom";
import { PlusIcon } from "@/components/roadmaps";
import { getCompletedSummary } from "@/lib";
import { GHOST_LINK_CLASSES, PRIMARY_LINK_CLASSES } from "./link-classes";

export interface RoadmapCompletedPanelProps {
  total: number;
  totalMinutes: number;
}

/** Ruta recorrida entera: tres nodos verdes unidos y un check en el último. Decorativa. */
function CompletedIllustration() {
  return (
    <svg
      data-testid="completed-illustration"
      className="hidden h-24 w-40 shrink-0 sm:block"
      viewBox="0 0 160 96"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M20 72 C 52 72, 52 24, 80 24 S 108 72, 140 72"
        className="stroke-status-completed/45"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="20" cy="72" r="8" className="fill-status-completed" />
      <circle cx="80" cy="24" r="8" className="fill-status-completed" />
      <circle cx="140" cy="72" r="13" className="fill-status-completed" />
      <circle cx="140" cy="72" r="20" className="stroke-status-completed/35" strokeWidth="1.5" />
      <path
        d="M134 72 l4 4 8 -8.5"
        className="stroke-node-done-check"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Panel de ruta completada (solo COMPLETED) sobre la superficie Nebula verde: ilustración,
 * «Completaste la ruta», resumen de pasos y horas, y los caminos para seguir (crear otra ruta o
 * volver a Mis Rutas). Sin confeti.
 */
export function RoadmapCompletedPanel({ total, totalMinutes }: RoadmapCompletedPanelProps) {
  const titleId = useId();

  return (
    <section
      aria-labelledby={titleId}
      className="empty-state-surface empty-state-surface--success flex items-center gap-10 px-6 py-8 lg:px-10"
    >
      <CompletedIllustration />
      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <h2 id={titleId} className="font-display font-bold text-2xl text-text-primary">
          Completaste la ruta
        </h2>
        <p className="font-body text-text-secondary">{getCompletedSummary(total, totalMinutes)}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <Link
            to="/dashboard/roadmaps/new"
            className={`${PRIMARY_LINK_CLASSES} h-11 w-full px-5 sm:w-fit`}
          >
            <PlusIcon className="size-4" />
            Crear otra ruta
          </Link>
          <Link
            to="/dashboard/roadmaps"
            className={`${GHOST_LINK_CLASSES} h-11 w-full px-5 sm:w-fit`}
          >
            Volver a Mis Rutas
          </Link>
        </div>
      </div>
    </section>
  );
}
