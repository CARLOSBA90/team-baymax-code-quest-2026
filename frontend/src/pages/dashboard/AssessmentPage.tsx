import { Link, useNavigate } from "react-router-dom";
import { useAssessmentQuestions, useSubmitAssessment } from "@/api/queries/assessments";
import { AssessmentWizard, ChevronRightIcon, CloseIcon } from "@/components/assessment";
import { GhostButton, NebulaSurface } from "@/components/ui";
import { getAssessmentSubtitle } from "@/lib";
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

export const AssessmentPage = () => {
  const navigate = useNavigate();
  const { data: questions } = useAssessmentQuestions();
  const { mutate, isPending } = useSubmitAssessment();

  const handleSubmit = (answers: AssessmentAnswer[]) => {
    const payload = { answers };
    console.info("[assessment] petición enviada", payload);
    // TODO: navegar a la pantalla de resultado
    mutate(payload, {
      onSuccess: (result) => console.info("[assessment] respuesta OK", result),
      onError: (error) => console.error("[assessment] error en el envío", error),
    });
  };

  return (
    <section className="flex h-full flex-col gap-7">
      <header className="flex items-end justify-between gap-6">
        <div className="flex flex-col gap-4">
          <AssessmentBreadcrumb />
          <div className="flex flex-col gap-3">
            <h1 className="font-display text-4xl font-bold text-text-primary">Descubre tu ruta</h1>
            <p className="text-text-secondary">{getAssessmentSubtitle(questions.length)}</p>
          </div>
        </div>
        <GhostButton size="sm" onClick={() => navigate("/dashboard/roadmaps")}>
          <CloseIcon className="size-4" />
          Salir
        </GhostButton>
      </header>
      <NebulaSurface>
        <AssessmentWizard questions={questions} onSubmit={handleSubmit} isSubmitting={isPending} />
      </NebulaSurface>
    </section>
  );
};
