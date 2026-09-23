import type { UseQueryResult } from "@tanstack/react-query";
import { useQuery } from "@tanstack/react-query";
import { getAssessmentQuestions } from "@/api/services";
import type { AssessmentQuestion } from "@/types";
import { assessmentsKeys } from "./keys";

export function useAssessmentQuestions(): UseQueryResult<AssessmentQuestion[]> {
  return useQuery({
    queryKey: assessmentsKeys.questions(),
    queryFn: getAssessmentQuestions,
  });
}
