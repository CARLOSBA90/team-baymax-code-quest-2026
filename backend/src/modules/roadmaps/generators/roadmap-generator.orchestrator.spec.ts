import { afterEach, describe, expect, it, vi } from 'vitest';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import { RoadmapGeneratorProvider } from '../roadmap.constants.js';
import type {
  RoadmapGenerator,
  RoadmapGeneratorContext,
} from './roadmap-generator.interface.js';
import { RoadmapGeneratorOrchestrator } from './roadmap-generator.orchestrator.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';
import { GeneratorConfigurationService } from './generator-configuration.service.js';

const context: RoadmapGeneratorContext = {
  targetCategory: SkillCategory.BACKEND,
  goalDescription: null,
  declaredLevel: null,
  profileScores: {},
  weeklyHours: null,
  maximumItems: 1,
  candidates: [
    {
      id: 'course-1',
      title: 'APIs',
      description: null,
      level: 1,
      durationHours: null,
      skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
    },
  ],
};

function provider(
  name: string,
  priority: number,
  generate: RoadmapGenerator['generate'],
): RoadmapGenerator {
  return {
    provider: name,
    fallbackPriority: priority,
    isAvailable: () => true,
    generate,
  };
}

afterEach(() => vi.unstubAllEnvs());

describe('RoadmapGeneratorOrchestrator', () => {
  it('uses the configured provider first', async () => {
    vi.stubEnv('ROADMAP_GENERATOR_PROVIDER', 'CUSTOM');
    const registry = new RoadmapGeneratorRegistry();
    registry.register(
      provider('CUSTOM', 10, async () => ({
        title: 'Custom',
        summary: 'Custom plan',
        items: [{ courseId: 'course-1', reason: 'Selected' }],
        provider: 'CUSTOM',
        version: 'custom-v1',
      })),
    );
    const orchestrator = new RoadmapGeneratorOrchestrator(
      registry,
      new GeneratorConfigurationService(),
    );

    const result = await orchestrator.generate(context);

    expect(result.provider).toBe('CUSTOM');
    expect(result.attemptedProviders).toEqual(['CUSTOM']);
  });

  it('uses registered fallbacks by priority and finishes with RULES', async () => {
    vi.stubEnv('ROADMAP_GENERATOR_PROVIDER', RoadmapGeneratorProvider.NVIDIA);
    const registry = new RoadmapGeneratorRegistry();
    registry.register(
      provider(RoadmapGeneratorProvider.NVIDIA, 100, async () => {
        throw new Error('provider unavailable');
      }),
    );
    registry.register(
      provider('SECONDARY', 200, async () => {
        throw new Error('secondary unavailable');
      }),
    );
    registry.register(
      provider(
        RoadmapGeneratorProvider.RULES,
        Number.MAX_SAFE_INTEGER,
        async () => ({
          title: 'Rules',
          summary: 'Fallback plan',
          items: [{ courseId: 'course-1', reason: 'Selected locally' }],
          provider: RoadmapGeneratorProvider.RULES,
          version: 'rules-v1',
        }),
      ),
    );
    const orchestrator = new RoadmapGeneratorOrchestrator(
      registry,
      new GeneratorConfigurationService(),
    );

    const result = await orchestrator.generate(context);

    expect(result.provider).toBe(RoadmapGeneratorProvider.RULES);
    expect(result.fallbackFrom).toBe(RoadmapGeneratorProvider.NVIDIA);
    expect(result.attemptedProviders).toEqual([
      RoadmapGeneratorProvider.NVIDIA,
      'SECONDARY',
      RoadmapGeneratorProvider.RULES,
    ]);
  });
});
