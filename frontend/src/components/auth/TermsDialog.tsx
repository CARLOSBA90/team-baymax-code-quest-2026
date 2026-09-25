import { Fragment, useId } from "react";
import { GhostButton, Modal, PrimaryButton } from "@/components/ui";
import { useScrolledToEnd } from "@/hooks";
import {
  TERMS_CLOSING,
  TERMS_INTRO,
  TERMS_SECTIONS,
  TERMS_TITLE,
  type TermsParagraph,
  termsParagraphText,
} from "./terms-text";

const SCROLL_HINT_ID = "terms-scroll-hint";

export interface TermsDialogProps {
  open: boolean;
  onClose: () => void;
  onAccept: () => void;
}

export function TermsDialog({ open, onClose, onAccept }: TermsDialogProps) {
  const titleId = useId();

  return (
    <Modal open={open} onClose={onClose} aria-labelledby={titleId}>
      <TermsDialogBody titleId={titleId} onClose={onClose} onAccept={onAccept} />
    </Modal>
  );
}

interface TermsDialogBodyProps {
  titleId: string;
  onClose: () => void;
  onAccept: () => void;
}

// Solo se monta mientras el modal está abierto: el gating de scroll se reinicia en cada apertura.
function TermsDialogBody({ titleId, onClose, onAccept }: TermsDialogBodyProps) {
  const { ref, hasReachedEnd, onScroll } = useScrolledToEnd<HTMLElement>();

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      <h2 id={titleId} className="pr-10 font-display text-xl font-semibold text-text-primary">
        {TERMS_TITLE}
      </h2>
      <section
        ref={ref}
        onScroll={onScroll}
        // biome-ignore lint/a11y/noNoninteractiveTabindex: zona scrollable: debe ser enfocable para desplazarla con teclado (axe scrollable-region-focusable)
        tabIndex={0}
        aria-label="Texto de los términos y condiciones"
        className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto overscroll-contain rounded-xl border border-border-field bg-bg-field p-4 font-body text-sm text-text-secondary outline-none focus-visible:shadow-ring-focus"
      >
        {TERMS_INTRO.map((paragraph) => (
          <TermsParagraphText key={termsParagraphText(paragraph)} paragraph={paragraph} />
        ))}
        {TERMS_SECTIONS.map((section) => (
          <Fragment key={section.heading}>
            <h3 className="mt-2 font-display text-base font-semibold text-text-primary">
              {section.heading}
            </h3>
            {section.paragraphs.map((paragraph) => (
              <TermsParagraphText key={termsParagraphText(paragraph)} paragraph={paragraph} />
            ))}
          </Fragment>
        ))}
        <hr className="my-2 border-border-divider" />
        <TermsParagraphText paragraph={TERMS_CLOSING} />
      </section>
      {!hasReachedEnd && (
        <p id={SCROLL_HINT_ID} className="text-xs text-text-muted">
          Desplázate hasta el final para aceptar.
        </p>
      )}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <GhostButton size="md" onClick={onClose}>
          Cerrar
        </GhostButton>
        <PrimaryButton
          onClick={onAccept}
          disabled={!hasReachedEnd}
          aria-describedby={hasReachedEnd ? undefined : SCROLL_HINT_ID}
          className="sm:w-fit sm:px-6"
        >
          Aceptar
        </PrimaryButton>
      </div>
    </div>
  );
}

interface TermsParagraphTextProps {
  paragraph: TermsParagraph;
}

// Párrafo con sus fragmentos en negrita como <strong>.
function TermsParagraphText({ paragraph }: TermsParagraphTextProps) {
  if (typeof paragraph === "string") return <p>{paragraph}</p>;
  return (
    <p>
      {paragraph.map((part) =>
        typeof part === "string" ? (
          part
        ) : (
          <strong key={part.bold} className="font-semibold text-text-primary">
            {part.bold}
          </strong>
        ),
      )}
    </p>
  );
}
