import type { SkillCategory } from '../../../generated/prisma/enums.js';

export interface AssessmentAnswerInputDto {
  questionId: string;
  optionId: string;
}

export interface SubmitAssessmentDto {
  answers: AssessmentAnswerInputDto[];
}

export type RoadmapGenerationStatus = 'GENERATED' | 'EXISTS' | 'FAILED';

export interface RoadmapGenerationResultDto {
  status: RoadmapGenerationStatus;
  id?: string;
  message?: string;
}

export interface AssessmentResultDto {
  id: string;
  userId: string;
  version: number;
  goalCategory: SkillCategory | null;
  profileScores: Record<string, number> | null;
  completedAt: Date | null;
  createdAt: Date;
  roadmap?: RoadmapGenerationResultDto;
}

export interface AssessmentResultResponseDto {
  data: AssessmentResultDto;
}

