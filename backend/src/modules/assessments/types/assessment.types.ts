import type { SkillCategory } from '../../../generated/prisma/enums.js';

export interface QuestionOptionSummary {
  id: string;
  order: number;
  value: number;
}

export interface QuestionWithOptions {
  id: string;
  order: number;
  category: SkillCategory;
  options: QuestionOptionSummary[];
}

export interface ValidatedAnswer {
  questionId: string;
  optionId: string;
  optionValue: number;
  questionCategory: SkillCategory;
  isGoalQuestion: boolean;
  optionOrder: number;
}

export interface CalculatedProfile {
  goalCategory: SkillCategory;
  profileScores: Record<SkillCategory, number>;
}
