import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation } from "@tanstack/react-query";
import { submitAssessment } from "@/api/services";
import type { AssessmentResult, SubmitAssessmentInput } from "@/types";
import { assessmentsKeys } from "./keys";

export function useSubmitAssessment(): UseMutationResult<
  AssessmentResult,
  Error,
  SubmitAssessmentInput
> {
  return useMutation<AssessmentResult, Error, SubmitAssessmentInput>({
    mutationKey: [...assessmentsKeys.all, "submit"],
    mutationFn: submitAssessment,
  });
}
