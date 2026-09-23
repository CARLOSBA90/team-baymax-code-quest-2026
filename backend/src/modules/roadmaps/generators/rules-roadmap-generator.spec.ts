import { describe, expect, it } from 'vitest';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import {
  DeclaredLevel,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';
import type { RoadmapGeneratorContext } from './roadmap-generator.interface.js';
import { RulesRoadmapGenerator } from './rules-roadmap-generator.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';

function generator(): RulesRoadmapGenerator {
  return new RulesRoadmapGenerator(new RoadmapGeneratorRegistry());
}

function context(): RoadmapGeneratorContext {
  return {
    targetCategory: SkillCategory.BACKEND,
    goalDescription: 'Build backend APIs',
    declaredLevel: DeclaredLevel.INTERMEDIATE,
    profileScores: {},
    weeklyHours: 5,
    maximumItems: 2,
    candidates: [
      {
        id: 'advanced',
        title: 'Advanced API',
        description: null,
        level: 3,
        durationHours: 4,
        skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
      },
      {
        id: 'intermediate',
        title: 'Intermediate API',
        description: null,
        level: 2,
        durationHours: 3,
        skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
      },
      {
        id: 'frontend',
        title: 'Frontend',
        description: null,
        level: 1,
        durationHours: 2,
        skills: [{ category: SkillCategory.FRONTEND, weight: 1 }],
      },
    ],
  };
}

describe('RulesRoadmapGenerator', () => {
  it('selects matching courses deterministically and prioritizes the declared level', async () => {
    const rulesGenerator = generator();

    const first = await rulesGenerator.generate(context());
    const second = await rulesGenerator.generate(context());

    expect(first).toEqual(second);
    expect(first.provider).toBe(RoadmapGeneratorProvider.RULES);
    expect(first.items.map(({ courseId }) => courseId)).toEqual([
      'intermediate',
      'advanced',
    ]);
  });

  it('returns no items when the catalog does not match the target skill', async () => {
    const rulesGenerator = generator();
    const input = context();
    input.targetCategory = SkillCategory.MOBILE;

    const result = await rulesGenerator.generate(input);

    expect(result.items).toEqual([]);
  });
});
