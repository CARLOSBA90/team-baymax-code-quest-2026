import { PrimaryButton } from "@/components/ui";
import { formatLongDate } from "@/lib";
import { PauseIcon, PlayIcon } from "./RoadmapDetailIcons";

export interface PausedBannerProps {
  pausedAt: string | null;
  /** Id del párrafo explicativo; los botones de completar lo usan como `aria-describedby`. */
  descriptionId: string;
  /** Id del h2: nombra la región y es destino de foco (`tabIndex={-1}`) tras un 409. */
  headingId: string;
  /** «Reanudar ruta»: el compositor lanza la reanudación (misma mutación que el menú ⋯). */
  onResume: () => void;
  /** Reanudación en curso (desde aquí o desde el ⋯): botón deshabilitado con «Reanudando…». */
  resuming: boolean;
}

const PAUSED_EFFECT = "Mientras esté pausada no se registra tu avance.";

/**
 * Banner de ruta en pausa (solo PAUSED): título ámbar, desde cuándo está pausada y «Reanudar ruta»
 * (`onResume`; mientras `resuming`, deshabilitado con «Reanudando…»). Los errores de reanudar no
 * van aquí sino en el Notice superior del compositor. No es una alerta: se lee en orden normal.
 * Mobile-first: en móvil el botón (`variant="form"`, h-12 w-full) baja a su propia línea a ancho
 * completo; desde `sm:` se ajusta a su contenido (`sm:w-fit sm:px-6`, equivalente a `cta`).
 */
export function PausedBanner({
  pausedAt,
  descriptionId,
  headingId,
  onResume,
  resuming,
}: PausedBannerProps) {
  const pausedOn = pausedAt ? formatLongDate(pausedAt) : "";
  const description = pausedOn ? `La pausaste el ${pausedOn}. ${PAUSED_EFFECT}` : PAUSED_EFFECT;

  return (
    <section
      aria-labelledby={headingId}
      className="flex flex-wrap items-center gap-4 rounded-2xl border border-border-paused-banner bg-bg-paused-banner p-4 sm:px-5 sm:py-4.5"
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-status-paused/12 text-status-paused">
        <PauseIcon className="size-5" />
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h2
          id={headingId}
          tabIndex={-1}
          className="font-body font-bold text-status-paused-text outline-none"
        >
          Esta ruta está en pausa
        </h2>
        <p id={descriptionId} className="font-body text-sm text-text-label">
          {description}
        </p>
      </div>
      <PrimaryButton
        variant="form"
        onClick={onResume}
        loading={resuming}
        loadingLabel="Reanudando…"
        className="ml-auto sm:w-fit sm:px-6"
      >
        <PlayIcon className="size-4" />
        Reanudar ruta
      </PrimaryButton>
    </section>
  );
}
