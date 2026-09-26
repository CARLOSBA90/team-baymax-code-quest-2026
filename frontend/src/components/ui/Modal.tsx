import type { MouseEvent, PropsWithChildren, SyntheticEvent } from "react";
import { useEffect, useRef } from "react";

const SCROLL_LOCK_CLASS = "overflow-hidden";

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  /** aria-label del botón X. Por defecto "Cerrar diálogo". */
  closeLabel?: string;
  /**
   * Omite la X: el consumidor ofrece su propia salida (p. ej. «Cancelar»), que pasa a ser el
   * primer enfocable. Esc y el backdrop siguen llamando a `onClose`.
   */
  hideCloseButton?: boolean;
  "aria-labelledby"?: string;
  "aria-label"?: string;
  "aria-describedby"?: string;
}

/**
 * Carcasa genérica y controlada sobre `<dialog>` nativo (`showModal()`): backdrop con blur,
 * panel y botón X (omitible con `hideCloseButton`). El consumidor aporta todo el contenido (heading, texto, botones) como
 * `children` y nombra el diálogo con `aria-labelledby` / `aria-label`.
 */
export function Modal({
  open,
  onClose,
  closeLabel = "Cerrar diálogo",
  hideCloseButton = false,
  "aria-labelledby": ariaLabelledBy,
  "aria-label": ariaLabel,
  "aria-describedby": ariaDescribedBy,
  children,
}: PropsWithChildren<ModalProps>) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const pressStartedOnBackdropRef = useRef(false);
  const openRef = useRef(open);
  openRef.current = open;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;

    if (open && !dialog.open) {
      returnFocusRef.current =
        document.activeElement instanceof HTMLElement ? document.activeElement : null;
      dialog.showModal();
      document.documentElement.classList.add(SCROLL_LOCK_CLASS);
    } else if (!open) {
      // El navegador puede haber cerrado ya el dialog (p. ej. CloseWatcher o botón atrás de
      // Android): la limpieza del bloqueo y la devolución del foco se hacen igualmente.
      if (dialog.open) dialog.close();
      document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
      const returnFocus = returnFocusRef.current;
      returnFocusRef.current = null;
      if (returnFocus?.isConnected) returnFocus.focus();
    }
  }, [open]);

  useEffect(
    () => () => {
      document.documentElement.classList.remove(SCROLL_LOCK_CLASS);
    },
    [],
  );

  const handleCancel = (event: SyntheticEvent<HTMLDialogElement>) => {
    event.preventDefault();
    onClose();
  };

  // Red de seguridad: el navegador cerró el diálogo mientras `open` sigue a true.
  const handleNativeClose = () => {
    if (openRef.current) onClose();
  };

  const handleMouseDown = (event: MouseEvent<HTMLDialogElement>) => {
    pressStartedOnBackdropRef.current = event.target === event.currentTarget;
  };

  const handleClick = (event: MouseEvent<HTMLDialogElement>) => {
    if (event.target === event.currentTarget && pressStartedOnBackdropRef.current) onClose();
  };

  return (
    // biome-ignore lint/a11y/useKeyWithClickEvents: Esc lo gestiona el evento nativo cancel del <dialog>
    <dialog
      ref={dialogRef}
      aria-labelledby={ariaLabelledBy}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      onCancel={handleCancel}
      onClose={handleNativeClose}
      onMouseDown={handleMouseDown}
      onClick={handleClick}
      className="m-0 size-full max-h-none max-w-none border-0 bg-transparent p-4 text-text-primary open:flex open:items-center open:justify-center backdrop:bg-bg-overlay backdrop:backdrop-blur-sm not-supports-[backdrop-filter:blur(1px)]:backdrop:bg-bg-overlay-solid"
    >
      {open && (
        <div className="nebula-card relative flex max-h-full w-full max-w-lg flex-col overflow-hidden rounded-3xl border border-border-card bg-bg-surface p-6 shadow-card backdrop-blur-lg sm:p-8">
          {hideCloseButton ? null : (
            <button
              type="button"
              aria-label={closeLabel}
              onClick={onClose}
              className="absolute top-4 right-4 inline-flex size-8 cursor-pointer items-center justify-center rounded-lg text-text-muted outline-none transition-colors hover:bg-bg-ghost-hover hover:text-text-primary focus-visible:shadow-ring-focus"
            >
              <svg
                className="size-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M18 6 6 18" />
                <path d="m6 6 12 12" />
              </svg>
            </button>
          )}
          {children}
        </div>
      )}
    </dialog>
  );
}
