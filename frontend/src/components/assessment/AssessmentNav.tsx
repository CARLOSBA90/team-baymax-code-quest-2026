import { PrimaryButton } from "@/components/auth";
import { GhostButton } from "@/components/ui";
import { ArrowRightIcon, ChevronLeftIcon, ChevronRightIcon } from "./AssessmentIcons";

export interface AssessmentNavProps {
  isFirst: boolean;
  isLast: boolean;
  canGoNext: boolean;
  isSubmitting?: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}

export function AssessmentNav({
  isFirst,
  isLast,
  canGoNext,
  isSubmitting = false,
  onPrev,
  onNext,
  onSubmit,
}: AssessmentNavProps) {
  return (
    <div className="mt-9 flex items-center justify-between gap-4">
      <GhostButton size="md" disabled={isFirst} onClick={onPrev}>
        <ChevronLeftIcon className="size-4" />
        Anterior
      </GhostButton>
      {isLast ? (
        <PrimaryButton
          variant="cta"
          type="button"
          disabled={!canGoNext}
          loading={isSubmitting}
          loadingLabel="Enviando…"
          onClick={onSubmit}
        >
          Descubrir mi ruta de aprendizaje
          <ArrowRightIcon className="size-4" />
        </PrimaryButton>
      ) : (
        <PrimaryButton variant="cta" type="button" disabled={!canGoNext} onClick={onNext}>
          Siguiente
          <ChevronRightIcon className="size-4" />
        </PrimaryButton>
      )}
    </div>
  );
}
