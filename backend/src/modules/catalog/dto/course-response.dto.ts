import type { PaginatedResponse } from '../../../common/interfaces/pagination.interface.js';
import type { SkillCategory } from '../../../generated/prisma/enums.js';

export interface CourseSkillResponseDto {
  skill: SkillCategory;
  weight: number;
}

export interface CourseResponseDto {
  id: string;
  slug: string;
  title: string;
  url: string;
  description: string | null;
  level: number;
  durationHours: number | null;
  skills: CourseSkillResponseDto[];
}

export type CoursesPageResponseDto = PaginatedResponse<CourseResponseDto>;
