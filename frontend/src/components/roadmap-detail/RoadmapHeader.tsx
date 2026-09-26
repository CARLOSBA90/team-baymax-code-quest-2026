import { RoadmapStatusBadge } from "@/components/roadmaps";
import { formatRelative } from "@/lib";
import type { RoadmapStatus } from "@/types";

export interface RoadmapHeaderProps {
  name: string;
  summary: string | null;
  status: RoadmapStatus;
  /** ISO de la última actividad; si no es una fecha válida se omite la línea. */
  lastActivity: string;
  /** Id del h1: lo usa la barra global como `aria-labelledby`. */
  headingId: string;
}

/** Cabecera del detalle: h1, resumen, badge de estado y última actividad. Sin menú ⋯ (slice 5). */
export function RoadmapHeader({
  name,
  summary,
  status,
  lastActivity,
  headingId,
}: RoadmapHeaderProps) {
  const activity = formatRelative(lastActivity);

  return (
    <header className="flex flex-col items-start gap-3">
      <h1 id={headingId} className="font-display text-3xl font-bold text-text-primary">
        {name}
      </h1>
      {summary ? <p className="text-text-secondary">{summary}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <RoadmapStatusBadge status={status} />
        {activity ? (
          <p className="font-body text-sm text-text-muted">Última actividad: {activity}</p>
        ) : null}
      </div>
    </header>
  );
}
