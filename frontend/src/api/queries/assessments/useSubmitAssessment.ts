import type { UseMutationResult } from "@tanstack/react-query";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { roadmapsKeys } from "@/api/queries/roadmaps";
import { submitAssessment } from "@/api/services";
import type { AssessmentResult, SubmitAssessmentInput } from "@/types";
import { assessmentsKeys } from "./keys";

export function useSubmitAssessment(): UseMutationResult<
  AssessmentResult,
  Error,
  SubmitAssessmentInput
> {
  const queryClient = useQueryClient();

  return useMutation<AssessmentResult, Error, SubmitAssessmentInput>({
    mutationKey: [...assessmentsKeys.all, "submit"],
    mutationFn: submitAssessment,
    onSuccess: () => {
      // El envío crea una ruta nueva: se invalida el listado (Mis Rutas y la pill del sidebar).
      // Sin await: la navegación del consumidor no espera al refetch.
      void queryClient.invalidateQueries({ queryKey: roadmapsKeys.all });
    },
  });
}
