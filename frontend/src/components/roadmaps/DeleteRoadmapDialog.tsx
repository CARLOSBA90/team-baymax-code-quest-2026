import { useId } from "react";
import { GhostButton, Modal, Notice, PrimaryButton } from "@/components/ui";
import type { RoadmapSummary } from "@/types";

export interface DeleteRoadmapDialogProps {
  /** Ruta a eliminar; `null` = diálogo cerrado. */
  roadmap: RoadmapSummary | null;
  /** Borrado en curso: botones deshabilitados y X/Esc/backdrop ignorados. */
  pending: boolean;
  /** Error ya traducido al español; se muestra como alerta dentro del diálogo. */
  errorMessage: string | null;
  onCancel: () => void;
  onConfirm: () => void;
}

function ignoreClose() {}

/**
 * Confirmación de borrado de una ruta sobre `ui/Modal`. Es controlado y no llama al back: la
 * página decide qué hacer en `onConfirm`. El botón de confirmación es rojo (`tone="danger"`).
 */
export function DeleteRoadmapDialog({
  roadmap,
  pending,
  errorMessage,
  onCancel,
  onConfirm,
}: DeleteRoadmapDialogProps) {
  const titleId = useId();
  const descriptionId = useId();

  return (
    <Modal
      open={roadmap !== null}
      onClose={pending ? ignoreClose : onCancel}
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
    >
      <div className="flex flex-col gap-5">
        <h2 id={titleId} className="pr-10 font-display text-xl font-semibold text-text-primary">
          ¿Eliminar {roadmap?.name}?
        </h2>
        <p id={descriptionId} className="font-body text-sm text-text-secondary">
          Se perderán tu progreso y tus entregas de esta ruta. Esta acción no se puede deshacer.
        </p>
        {errorMessage && <Notice variant="error">{errorMessage}</Notice>}
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <GhostButton size="md" onClick={onCancel} disabled={pending}>
            Cancelar
          </GhostButton>
          <PrimaryButton
            tone="danger"
            onClick={onConfirm}
            loading={pending}
            loadingLabel="Eliminando…"
            className="sm:w-fit sm:px-6"
          >
            Eliminar ruta
          </PrimaryButton>
        </div>
      </div>
    </Modal>
  );
}
