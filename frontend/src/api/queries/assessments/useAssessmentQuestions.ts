import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getAssessmentQuestions } from "@/api/services";
import type { AssessmentQuestion } from "@/types";
import { assessmentsKeys } from "./keys";

// Las preguntas apenas cambian: se reutiliza la caché al volver a entrar al cuestionario.
export const ASSESSMENT_QUESTIONS_STALE_TIME = 2 * 60 * 1000;

export function useAssessmentQuestions(): UseQueryResult<AssessmentQuestion[]> {
  return useQuery({
    queryKey: assessmentsKeys.questions(),
    queryFn: getAssessmentQuestions,
    staleTime: ASSESSMENT_QUESTIONS_STALE_TIME,
  });
}
