import { get, post } from "@/api/client";
import type { AssessmentQuestion, AssessmentResult, SubmitAssessmentInput } from "@/types";

export function getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
  return get<AssessmentQuestion[]>("/assessments/questions");
}

/**
 * Techo de espera del submit: holgado sobre los ~30 s de timeout total del backend y su fallback
 * a `rules`, pero acota el caso «conexión muerta» detrás de un diálogo sin salida.
 * Por petición a propósito: `api/client.ts` no lleva `timeout` global (el resto es rápido).
 */
export const SUBMIT_ASSESSMENT_TIMEOUT_MS = 60_000;

export function submitAssessment(input: SubmitAssessmentInput): Promise<AssessmentResult> {
  return post<AssessmentResult, SubmitAssessmentInput>("/assessments/submit", input, {
    timeout: SUBMIT_ASSESSMENT_TIMEOUT_MS,
  });
}
