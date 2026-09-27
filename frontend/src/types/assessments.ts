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

/** Resultado de la auto-generación de la ruta al enviar el cuestionario. */
export type RoadmapGenerationStatus = "GENERATED" | "EXISTS" | "FAILED";

/** `roadmap` de `POST /assessments/submit`: `id` llega salvo con `FAILED` (entonces `message`). */
export interface RoadmapGenerationResult {
  status: RoadmapGenerationStatus;
  id?: string;
  message?: string;
}

/** `data` de `POST /assessments/submit`. `id` es el del assessment; el de la ruta va en `roadmap.id`. */
export interface AssessmentResult {
  id: string;
  userId: string;
  version: number;
  goalCategory: SkillCategory | null;
  profileScores: Record<string, number> | null;
  completedAt: string | null;
  createdAt: string;
  roadmap?: RoadmapGenerationResult;
}
