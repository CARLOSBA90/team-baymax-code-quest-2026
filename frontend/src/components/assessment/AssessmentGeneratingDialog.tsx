import { useEffect, useId, useRef, useState } from "react";
import { Modal } from "@/components/ui";
import {
  ASSESSMENT_GENERATING_DESCRIPTION,
  ASSESSMENT_GENERATING_TITLE,
  type AssessmentGeneratingStage,
} from "@/lib";
import { SpinnerIcon } from "./AssessmentIcons";

export interface AssessmentGeneratingDialogProps {
  /** Espera en curso: abre el diálogo. */
  open: boolean;
  /** Etapa visible (`null` mientras no hay espera). */
  stage: AssessmentGeneratingStage | null;
}

/** Reaperturas permitidas tras un cierre nativo del `<dialog>` antes de rendirse. */
export const MAX_GENERATING_REOPENS = 2;

/**
 * Diálogo de espera mientras el backend genera la ruta: sin X, sin botones y sin salida (`Esc` y
 * backdrop no cierran, gracias a que `ui/Modal` ya los neutraliza y aquí no se hace nada con
 * ellos). Si el navegador cierra el `<dialog>` por su cuenta (CloseWatcher, gesto atrás de
 * Android) la espera se restablece, hasta `MAX_GENERATING_REOPENS` veces por envío; superada la
 * cota se deja de reabrir y el `Modal` se desmonta, liberando el bloqueo de scroll.
 */
export function AssessmentGeneratingDialog({ open, stage }: AssessmentGeneratingDialogProps) {
  const titleId = useId();
  const descriptionId = useId();
  const contentRef = useRef<HTMLDivElement>(null);
  const [reopens, setReopens] = useState(0);

  // Cada envío nuevo recupera la trampa completa (la cota se reinicia).
  useEffect(() => {
    if (open) setReopens(0);
  }, [open]);

  // `Modal` llama a `onClose` en Esc, backdrop y cierre nativo. Los dos primeros ya quedan
  // neutralizados por `Modal` (el `<dialog>` sigue con `open`), así que solo se reacciona cuando
  // el navegador lo cerró de verdad.
  const handleClose = () => {
    if (contentRef.current?.closest("dialog")?.open === false) setReopens((n) => n + 1);
  };

  // Cota agotada: se desmonta el `Modal`, cuyo cleanup libera `overflow-hidden` de `<html>`.
  // Queda el estado previo al cambio: CTA en «Enviando…» con las respuestas intactas.
  // El `return` va después de todos los hooks para no alterar su orden entre renders.
  if (reopens > MAX_GENERATING_REOPENS) return null;

  return (
    <Modal
      key={reopens}
      open={open}
      onClose={handleClose}
      hideCloseButton
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {stage ? (
        <div
          ref={contentRef}
          tabIndex={-1}
          data-testid="assessment-generating-panel"
          className="flex flex-col items-center gap-5 text-center outline-none"
        >
          <span
            aria-hidden="true"
            className="flex size-14 items-center justify-center rounded-2xl bg-accent/12 text-accent-soft"
          >
            <SpinnerIcon
              data-testid="assessment-generating-spinner"
              className="size-7 animate-spin motion-reduce:animate-none"
            />
          </span>
          <h2 id={titleId} className="font-display text-xl font-semibold text-text-primary">
            {ASSESSMENT_GENERATING_TITLE}
          </h2>
          <p id={descriptionId} className="font-body text-sm text-text-secondary">
            {ASSESSMENT_GENERATING_DESCRIPTION}
          </p>
          <p
            data-testid="assessment-generating-stage"
            className="font-body font-semibold text-[15px] text-accent-soft"
          >
            {stage.message}
          </p>
        </div>
      ) : null}
    </Modal>
  );
}
