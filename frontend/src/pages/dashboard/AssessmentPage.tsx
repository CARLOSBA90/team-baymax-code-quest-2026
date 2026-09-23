import type { ReactElement } from "react";
import { Link, useNavigate } from "react-router-dom";
import { getApiErrorMessage } from "@/api/errors";
import { useAssessmentQuestions, useSubmitAssessment } from "@/api/queries/assessments";
import {
  AssessmentWizard,
  AssessmentWizardSkeleton,
  ChevronRightIcon,
  CloseIcon,
} from "@/components/assessment";
import { AuthNotice, PrimaryButton } from "@/components/auth";
import { GhostButton, NebulaSurface } from "@/components/ui";
import { ASSESSMENT_COMPLETED_STATE, getAssessmentSubtitle } from "@/lib";
import type { AssessmentAnswer } from "@/types";

function AssessmentBreadcrumb() {
  return (
    <nav aria-label="Ruta de navegación">
      <ol className="flex items-center gap-3 text-sm">
        <li>
          <Link
            to="/dashboard/roadmaps"
            className="font-semibold text-accent-soft hover:text-accent-soft-hover"
          >
            Mis Rutas
          </Link>
        </li>
        <li aria-hidden="true" className="text-text-label">
          <ChevronRightIcon className="size-3" />
        </li>
        <li aria-current="page" className="text-text-label">
          Nueva ruta
        </li>
      </ol>
    </nav>
  );
}

interface AssessmentLoadErrorProps {
  message: string;
  onRetry: () => void;
}

// Sin estado de "reintentando": en TanStack Query v5 un refetch sin datos vuelve a `pending`,
// así que durante el reintento se ve el esqueleto, no este bloque.
function AssessmentLoadError({ message, onRetry }: AssessmentLoadErrorProps) {
  return (
    <div className="flex w-full max-w-md flex-col gap-4">
      <AuthNotice variant="error">{message}</AuthNotice>
      <PrimaryButton onClick={onRetry}>Reintentar</PrimaryButton>
    </div>
  );
}

export const AssessmentPage = () => {
  const navigate = useNavigate();
  const { data: questions, isError, error, refetch } = useAssessmentQuestions();
  const submit = useSubmitAssessment();

  const handleSubmit = (answers: AssessmentAnswer[]) => {
    submit.mutate(
      { answers },
      {
        onSuccess: () =>
          navigate("/dashboard/roadmaps", { replace: true, state: ASSESSMENT_COMPLETED_STATE }),
      },
    );
  };

  // Los datos mandan sobre el error: una revalidación fallida con preguntas ya cargadas
  // no desmonta el wizard (se perderían las respuestas a medias).
  let content: ReactElement;
  if (questions === undefined) {
    content = isError ? (
      <AssessmentLoadError message={getApiErrorMessage(error)} onRetry={() => void refetch()} />
    ) : (
      <AssessmentWizardSkeleton />
    );
  } else if (questions.length === 0) {
    content = (
      <p className="text-center text-text-secondary">
        Todavía no hay preguntas disponibles. Vuelve a intentarlo más tarde.
      </p>
    );
  } else {
    content = (
      <div className="flex w-full max-w-3xl flex-col gap-6">
        {submit.isError && (
          <AuthNotice variant="error">{getApiErrorMessage(submit.error)}</AuthNotice>
        )}
        <AssessmentWizard
          questions={questions}
          onSubmit={handleSubmit}
          isSubmitting={submit.isPending}
        />
      </div>
    );
  }

  return (
    <section className="flex h-full flex-col gap-7">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <AssessmentBreadcrumb />
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-4xl font-bold text-text-primary">Descubre tu ruta</h1>
            <p className="text-text-secondary">{getAssessmentSubtitle(questions?.length)}</p>
          </div>
        </div>
        <GhostButton size="sm" onClick={() => navigate("/dashboard/roadmaps")}>
          <CloseIcon className="size-4" />
          Salir
        </GhostButton>
      </header>
      <NebulaSurface>{content}</NebulaSurface>
    </section>
  );
};
