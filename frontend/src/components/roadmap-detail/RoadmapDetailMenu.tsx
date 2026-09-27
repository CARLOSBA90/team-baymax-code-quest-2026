import { DropdownMenu, type DropdownMenuItem } from "@/components/ui";
import type { RoadmapStatus } from "@/types";
import { MoreIcon, PauseIcon, PlayIcon, SpinnerIcon } from "./RoadmapDetailIcons";

export interface RoadmapDetailMenuProps {
  roadmapName: string;
  status: RoadmapStatus;
  /** Pausar/reanudar en curso: el disparador entero queda deshabilitado (no abre). */
  disabled: boolean;
  onPause: () => void;
  onResume: () => void;
  /** «Eliminar ruta»: el compositor abre la confirmación; el menú nunca borra por sí solo. */
  onDelete: () => void;
}

/**
 * Menú ⋯ del detalle de ruta: «Pausar ruta» (IN_PROGRESS) o «Reanudar ruta» (PAUSED) y siempre
 * «Eliminar ruta» (danger) al final; NOT_STARTED y COMPLETED solo ofrecen eliminar. Solo emite
 * callbacks: el compositor hace las peticiones. Disparador de 44×44 con borde, alineado a la
 * derecha (el radio lo pone `DropdownMenu`, así que aquí no va otra utilidad de `rounded-*`).
 * Mientras `disabled` (pausar/reanudar en curso), además de `aria-disabled` (lo pone
 * `DropdownMenu`, con `aria-disabled:opacity-50`) el ⋯ se sustituye por `SpinnerIcon`
 * (`animate-spin`, decorativo) como indicador visual de carga.
 */
export function RoadmapDetailMenu({
  roadmapName,
  status,
  disabled,
  onPause,
  onResume,
  onDelete,
}: RoadmapDetailMenuProps) {
  const items: DropdownMenuItem[] = [];
  if (status === "IN_PROGRESS") {
    items.push({
      id: "pause",
      label: "Pausar ruta",
      icon: <PauseIcon className="size-4" />,
      onSelect: onPause,
    });
  } else if (status === "PAUSED") {
    items.push({
      id: "resume",
      label: "Reanudar ruta",
      icon: <PlayIcon className="size-4" />,
      onSelect: onResume,
    });
  }
  items.push({ id: "delete", label: "Eliminar ruta", tone: "danger", onSelect: onDelete });

  return (
    <DropdownMenu
      triggerLabel={`Más acciones para ${roadmapName}`}
      trigger={
        disabled ? <SpinnerIcon className="size-5 animate-spin" /> : <MoreIcon className="size-5" />
      }
      items={items}
      align="end"
      disabled={disabled}
      triggerClassName="size-11 border border-border-card text-text-secondary transition-colors hover:bg-bg-ghost-hover hover:text-text-primary"
    />
  );
}
