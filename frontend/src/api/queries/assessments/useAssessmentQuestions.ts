import type { DefinedUseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { ASSESSMENT_QUESTIONS_MOCK } from "@/api/mocks/assessments";
import { getAssessmentQuestions } from "@/api/services";
import type { AssessmentQuestion } from "@/types";
import { assessmentsKeys } from "./keys";

// TEMPORAL: `initialData` + `staleTime: Infinity` evitan el estado de carga mientras el
// servicio devuelve el mock. Quitar ambos al migrar a HTTP.
export function useAssessmentQuestions(): DefinedUseQueryResult<AssessmentQuestion[]> {
  return useQuery({
    queryKey: assessmentsKeys.questions(),
    queryFn: getAssessmentQuestions,
    initialData: ASSESSMENT_QUESTIONS_MOCK,
    staleTime: Infinity,
  });
}
