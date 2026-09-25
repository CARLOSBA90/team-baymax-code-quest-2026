import { get, post } from "@/api/client";
import type { AssessmentQuestion, AssessmentResult, SubmitAssessmentInput } from "@/types";

export function getAssessmentQuestions(): Promise<AssessmentQuestion[]> {
  return get<AssessmentQuestion[]>("/assessments/questions");
}

export function submitAssessment(input: SubmitAssessmentInput): Promise<AssessmentResult> {
  return post<AssessmentResult, SubmitAssessmentInput>("/assessments/submit", input);
}
