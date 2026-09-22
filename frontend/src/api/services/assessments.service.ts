import { ASSESSMENT_QUESTIONS_MOCK, buildAssessmentResultMock } from "@/api/mocks/assessments";
import type { AssessmentQuestion, AssessmentResult, SubmitAssessmentInput } from "@/types";

// TEMPORAL: devuelve el mock sin HTTP. Para migrar, cambiar cada cuerpo por su línea real
// (importando `get`/`post` de "@/api/client") y borrar `@/api/mocks/assessments`:
//   return get<AssessmentQuestion[]>("/assessments/questions");
//   return post<AssessmentResult, SubmitAssessmentInput>("/assessments/submit", input);

export function getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
  return Promise.resolve(ASSESSMENT_QUESTIONS_MOCK);
}

export function submitAssessment(input: SubmitAssessmentInput): Promise<AssessmentResult> {
  return Promise.resolve(buildAssessmentResultMock(input));
}
