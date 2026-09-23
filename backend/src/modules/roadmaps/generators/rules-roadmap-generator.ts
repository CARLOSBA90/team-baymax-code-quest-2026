import { Injectable, type OnModuleInit } from '@nestjs/common';
import {
  DeclaredLevel,
  EMPTY_COLLECTION_SIZE,
  FIRST_COLLECTION_INDEX,
  MIN_SKILL_WEIGHT,
  PublicCourseLevel,
  ROADMAP_RULES_VERSION,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';
import type {
  GeneratedRoadmapPlan,
  GeneratorCandidate,
  RoadmapGenerator,
  RoadmapGeneratorContext,
} from './roadmap-generator.interface.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';

const LEVEL_VALUE: Readonly<Record<DeclaredLevel, PublicCourseLevel>> = {
  [DeclaredLevel.BEGINNER]: PublicCourseLevel.BEGINNER,
  [DeclaredLevel.INTERMEDIATE]: PublicCourseLevel.INTERMEDIATE,
  [DeclaredLevel.ADVANCED]: PublicCourseLevel.ADVANCED,
};

@Injectable()
export class RulesRoadmapGenerator implements RoadmapGenerator, OnModuleInit {
  readonly provider = RoadmapGeneratorProvider.RULES;
  readonly fallbackPriority = Number.MAX_SAFE_INTEGER;

  constructor(private readonly registry: RoadmapGeneratorRegistry) {}

  onModuleInit(): void {
    this.registry.register(this);
  }

  isAvailable(): boolean {
    return true;
  }

  generate(context: RoadmapGeneratorContext): Promise<GeneratedRoadmapPlan> {
    const declaredLevel = context.declaredLevel
      ? LEVEL_VALUE[context.declaredLevel]
      : null;
    const selected = context.candidates
      .filter((candidate) =>
        candidate.skills.some(
          (skill) => skill.category === context.targetCategory,
        ),
      )
      .sort((left, right) => {
        const leftWeight = this.targetWeight(left, context.targetCategory);
        const rightWeight = this.targetWeight(right, context.targetCategory);
        const leftDistance =
          declaredLevel === null
            ? EMPTY_COLLECTION_SIZE
            : Math.abs(left.level - declaredLevel);
        const rightDistance =
          declaredLevel === null
            ? EMPTY_COLLECTION_SIZE
            : Math.abs(right.level - declaredLevel);
        return (
          rightWeight - leftWeight ||
          leftDistance - rightDistance ||
          left.level - right.level ||
          left.id.localeCompare(right.id)
        );
      })
      .slice(FIRST_COLLECTION_INDEX, context.maximumItems);

    return Promise.resolve({
      title: `Ruta de ${context.targetCategory.toLowerCase()}`,
      summary: `Ruta personalizada con ${selected.length} cursos para ${context.targetCategory}.`,
      items: selected.map((candidate) => ({
        courseId: candidate.id,
        reason: `Develops the ${context.targetCategory} skills identified in the assessment.`,
      })),
      provider: this.provider,
      version: ROADMAP_RULES_VERSION,
    });
  }

  private targetWeight(
    candidate: GeneratorCandidate,
    targetCategory: RoadmapGeneratorContext['targetCategory'],
  ): number {
    return (
      candidate.skills.find((skill) => skill.category === targetCategory)
        ?.weight ?? MIN_SKILL_WEIGHT
    );
  }
}
