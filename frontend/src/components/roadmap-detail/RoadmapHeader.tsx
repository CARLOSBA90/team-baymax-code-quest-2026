import { RoadmapStatusBadge } from "@/components/roadmaps";
import { formatRelative } from "@/lib";
import type { RoadmapStatus } from "@/types";

export interface RoadmapHeaderProps {
  name: string;
  summary: string | null;
  status: RoadmapStatus;
  /** ISO de la última actividad; si no es una fecha válida se omite la línea. */
  lastActivity: string;
  /** Id del h1: lo usa la barra global como `aria-labelledby` y es el destino de foco de reserva. */
  headingId: string;
}

/**
 * Cabecera del detalle: h1, resumen, badge de estado y última actividad. Sin menú ⋯ (slice 5).
 * En móvil el h1 baja a 26/32px (`text-[26px]/8`, sin `leading-*` para que `sm:text-3xl`
 * recupere su interlineado) y el resumen queda solo para lectores de pantalla (`sr-only`,
 * visible desde `sm:`), así se lee igual en todos los anchos.
 */
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
      <h1
        id={headingId}
        tabIndex={-1}
        className="font-display text-[26px]/8 font-bold text-text-primary outline-none sm:text-3xl"
      >
        {name}
      </h1>
      {summary ? <p className="sr-only text-text-secondary sm:not-sr-only">{summary}</p> : null}
      <div className="flex flex-wrap items-center gap-3">
        <RoadmapStatusBadge status={status} />
        {activity ? (
          <p className="font-body text-sm text-text-muted">Última actividad: {activity}</p>
        ) : null}
      </div>
    </header>
  );
}
