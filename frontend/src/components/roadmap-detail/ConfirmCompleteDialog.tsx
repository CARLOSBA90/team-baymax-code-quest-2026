import { useId } from "react";
import { GhostButton, Modal, Notice, PrimaryButton } from "@/components/ui";
import type { RoadmapItem } from "@/types";
import { ItemThumbnail } from "./ItemThumbnail";
import { CheckIcon } from "./RoadmapDetailIcons";

export interface ConfirmCompleteDialogProps {
  /** Paso a completar; `null` = diálogo cerrado. */
  item: RoadmapItem | null;
  /** Petición en curso: botones deshabilitados y Esc/backdrop ignorados. */
  pending: boolean;
  /** Error ya traducido al español; se muestra como alerta dentro del diálogo. */
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function ignoreClose() {}

/**
 * Confirmación de «Marcar como completado» sobre `ui/Modal` sin X (la salida es «Cancelar», que
 * recibe el foco inicial). Controlado y sin llamadas al back: el compositor decide qué hacer en
 * `onConfirm`. Botones apilados en móvil con «Sí, completar» arriba visualmente pero «Cancelar»
 * primero en el DOM (`flex-col-reverse`); desde `sm:` en fila a la derecha.
 */
export function ConfirmCompleteDialog({
  item,
  pending,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmCompleteDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={item !== null}
      onClose={pending ? ignoreClose : onCancel}
      hideCloseButton
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      {item ? (
        <div className="flex flex-col gap-5">
          <span className="flex size-11 items-center justify-center rounded-xl bg-accent/12 text-accent-soft">
            <CheckIcon className="size-5" />
          </span>
          <h2 id={titleId} className="font-display text-xl font-semibold text-text-primary">
            ¿Marcar este paso como completado?
          </h2>
          <div className="flex items-center gap-3 rounded-2xl border border-border-item bg-bg-item p-3">
            <ItemThumbnail key={item.image ?? "none"} src={item.image} type={item.type} size="md" />
            <p className="min-w-0 font-body font-semibold text-[15px] text-text-primary">
              {item.name}
            </p>
          </div>
          <p id={descriptionId} className="font-body text-sm text-text-secondary">
            Esta acción{" "}
            <strong className="font-semibold text-text-primary">no se puede deshacer</strong>.
          </p>
          {errorMessage ? <Notice variant="error">{errorMessage}</Notice> : null}
          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <GhostButton size="md" onClick={onCancel} disabled={pending}>
              Cancelar
            </GhostButton>
            <PrimaryButton
              onClick={onConfirm}
              loading={pending}
              loadingLabel="Completando…"
              className="sm:w-fit sm:px-6"
            >
              Sí, completar
            </PrimaryButton>
          </div>
        </div>
      ) : null}
    </Modal>
  );
}
