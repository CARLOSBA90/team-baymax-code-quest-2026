import type { SkillCategory } from '../../../generated/prisma/enums.js';
import type { DeclaredLevel } from '../roadmap.constants.js';

export interface GeneratorCandidate {
  id: string;
  title: string;
  description: string | null;
  level: number;
  durationHours: number | null;
  skills: Array<{ category: SkillCategory; weight: number }>;
}

export interface RoadmapGeneratorContext {
  targetCategory: SkillCategory;
  goalDescription: string | null;
  declaredLevel: DeclaredLevel | null;
  profileScores: Record<string, number>;
  weeklyHours: number | null;
  maximumItems: number;
  candidates: GeneratorCandidate[];
}

export interface GeneratedCourseSelection {
  courseId: string;
  reason: string;
}

export interface GeneratedRoadmapPlan {
  title: string;
  summary: string;
  items: GeneratedCourseSelection[];
  provider: string;
  version: string;
  fallbackFrom?: string;
  attemptedProviders?: string[];
  attemptedModels?: string[];
}

export interface RoadmapGenerator {
  readonly provider: string;
  readonly fallbackPriority: number;
  isAvailable(): boolean;
  generate(context: RoadmapGeneratorContext): Promise<GeneratedRoadmapPlan>;
}
