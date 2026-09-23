import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  RoadmapGenerationMode,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';
import { GeneratorConfigurationService } from './generator-configuration.service.js';

afterEach(() => vi.unstubAllEnvs());

describe('GeneratorConfigurationService', () => {
  it('builds an ordered provider chain ending in RULES', () => {
    vi.stubEnv('ROADMAP_GENERATOR_PROVIDER', 'NVIDIA');
    vi.stubEnv('ROADMAP_GENERATOR_FALLBACKS', 'CUSTOM,RULES,CUSTOM');
    const service = new GeneratorConfigurationService();

    expect(service.providerChain(RoadmapGenerationMode.AUTO)).toEqual([
      RoadmapGeneratorProvider.NVIDIA,
      'CUSTOM',
      RoadmapGeneratorProvider.RULES,
    ]);
  });

  it('uses only RULES in deterministic mode', () => {
    const service = new GeneratorConfigurationService();

    expect(service.providerChain(RoadmapGenerationMode.DETERMINISTIC)).toEqual([
      RoadmapGeneratorProvider.RULES,
    ]);
  });

  it('reads ordered NVIDIA model fallbacks without exposing the key', () => {
    vi.stubEnv('NVIDIA_API_KEY', 'private-key');
    vi.stubEnv('NVIDIA_MODELS', 'model-a,model-b,model-a');
    vi.stubEnv('NVIDIA_MODEL', 'legacy-model');
    const service = new GeneratorConfigurationService();

    expect(service.publicConfiguration().nvidia).toEqual({
      available: true,
      base_url: 'https://integrate.api.nvidia.com/v1',
      models: ['model-a', 'model-b', 'legacy-model'],
      timeout_ms: 10_000,
      total_timeout_ms: 30_000,
      max_attempts: 2,
    });
    expect(JSON.stringify(service.publicConfiguration())).not.toContain(
      'private-key',
    );
  });
});
