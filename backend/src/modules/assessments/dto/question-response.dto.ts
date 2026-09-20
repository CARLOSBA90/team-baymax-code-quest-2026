import type { SkillCategory } from '../../../generated/prisma/enums.js';

export interface QuestionOptionResponseDto {
  id: string;
  text: string;
  order: number;
}

export interface QuestionResponseDto {
  id: string;
  text: string;
  category: SkillCategory;
  order: number;
  options: QuestionOptionResponseDto[];
}

export interface QuestionsListResponseDto {
  data: QuestionResponseDto[];
}
