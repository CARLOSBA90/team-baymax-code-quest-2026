export type SkillCategory =
  | "BACKEND"
  | "FRONTEND"
  | "DEVOPS"
  | "DATABASES"
  | "MOBILE"
  | "TESTING"
  | "WEB_FUNDAMENTALS";

export interface AssessmentOption {
  id: string;
  text: string;
  order: number;
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  category: SkillCategory;
  order: number;
  options: AssessmentOption[];
  /** Solo presentación; el backend aún no lo envía. Fallback: DEFAULT_ASSESSMENT_HELPER_TEXT. */
  helperText?: string;
  /** Solo presentación; el backend aún no lo envía. Fallback: getSkillCategoryLabel(category). */
  sectionLabel?: string;
}

export interface AssessmentAnswer {
  questionId: string;
  optionId: string;
}

/** questionId -> optionId */
export type AssessmentAnswers = Record<string, string>;

export interface SubmitAssessmentInput {
  answers: AssessmentAnswer[];
}

export interface AssessmentResult {
  id: string;
  userId: string;
  version: number;
  goalCategory: SkillCategory | null;
  profileScores: Record<string, number> | null;
  completedAt: string | null;
  createdAt: string;
}
