import { describe, expect, it, vi } from 'vitest';
import { RoadmapGeneratorProvider } from '../roadmap.constants.js';
import type { RoadmapGenerator } from './roadmap-generator.interface.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';

function provider(
  name: string,
  priority: number,
  available = true,
): RoadmapGenerator {
  return {
    provider: name,
    fallbackPriority: priority,
    isAvailable: () => available,
    generate: vi.fn(),
  };
}

describe('RoadmapGeneratorRegistry', () => {
  it('builds a chain from the primary provider, available fallbacks and RULES', () => {
    const registry = new RoadmapGeneratorRegistry();
    registry.register(provider('PRIMARY', 100));
    registry.register(provider('EARLY', 10));
    registry.register(provider('DISABLED', 1, false));
    registry.register(
      provider(RoadmapGeneratorProvider.RULES, Number.MAX_SAFE_INTEGER),
    );

    expect(
      registry.resolveChain(['PRIMARY']).map(({ provider }) => provider),
    ).toEqual(['PRIMARY', 'EARLY', RoadmapGeneratorProvider.RULES]);
  });

  it('rejects duplicate provider registrations', () => {
    const registry = new RoadmapGeneratorRegistry();
    registry.register(provider('CUSTOM', 1));

    expect(() => registry.register(provider('CUSTOM', 2))).toThrow(
      'already registered',
    );
  });
});
