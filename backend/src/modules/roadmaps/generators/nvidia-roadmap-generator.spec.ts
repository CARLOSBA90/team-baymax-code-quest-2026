import { afterEach, describe, expect, it, vi } from 'vitest';
import { SkillCategory } from '../../../generated/prisma/enums.js';
import { RoadmapGeneratorProvider } from '../roadmap.constants.js';
import type { RoadmapGeneratorContext } from './roadmap-generator.interface.js';
import { NvidiaRoadmapGenerator } from './nvidia-roadmap-generator.js';
import { RoadmapGeneratorRegistry } from './roadmap-generator.registry.js';
import { GeneratorConfigurationService } from './generator-configuration.service.js';
import {
  compactGenerationContext,
  AI_CANDIDATE_LIMIT,
  AI_DESCRIPTION_LIMIT,
} from './compact-generation-context.js';

function generator(): NvidiaRoadmapGenerator {
  return new NvidiaRoadmapGenerator(
    new RoadmapGeneratorRegistry(),
    new GeneratorConfigurationService(),
  );
}

const input: RoadmapGeneratorContext = {
  targetCategory: SkillCategory.BACKEND,
  goalDescription: 'Build backend APIs',
  declaredLevel: null,
  profileScores: {},
  weeklyHours: 5,
  maximumItems: 1,
  candidates: [
    {
      id: 'course-1',
      title: 'APIs',
      description: null,
      level: 1,
      durationHours: 2,
      skills: [{ category: SkillCategory.BACKEND, weight: 1 }],
    },
  ],
};

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe('NvidiaRoadmapGenerator', () => {
  it('aborts stalled requests and exhausts the bounded attempts', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'first,second,third');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_TIMEOUT_MS', '150000');
    vi.stubEnv('NVIDIA_TOTAL_TIMEOUT_MS', '60');
    vi.stubEnv('NVIDIA_MAX_ATTEMPTS', '2');
    const fetchMock = vi.fn(
      (_url: string, options: RequestInit) =>
        new Promise((_resolve, reject) => {
          const signal = options.signal!;
          if (signal.aborted) reject(signal.reason);
          else
            signal.addEventListener('abort', () => reject(signal.reason), {
              once: true,
            });
        }),
    );
    vi.stubGlobal('fetch', fetchMock);
    await expect(generator().generate(input)).rejects.toThrow(
      'All NVIDIA models failed',
    );
    expect(fetchMock.mock.calls.length).toBeLessThanOrEqual(2);
    expect(fetchMock.mock.calls.length).toBeGreaterThan(0);
    for (const [, options] of fetchMock.mock.calls)
      expect(options.signal?.aborted).toBe(true);
  });
  it('bounds provider context without mutating the captured catalog', () => {
    const context = {
      ...input,
      candidates: Array.from({ length: 40 }, (_, i) => ({
        ...input.candidates[0],
        id: `course-${i}`,
        description: 'x'.repeat(1000),
      })),
    };
    const compact = compactGenerationContext(context);
    expect(compact.candidates).toHaveLength(AI_CANDIDATE_LIMIT);
    expect(compact.candidates[0].description).toHaveLength(
      AI_DESCRIPTION_LIMIT,
    );
    expect(context.candidates).toHaveLength(40);
    expect(context.candidates[0].description).toHaveLength(1000);
  });

  it('caps attempts and shares the total time budget even with a large legacy timeout', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'first,second,third,fourth');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_TIMEOUT_MS', '150000');
    vi.stubEnv('NVIDIA_TOTAL_TIMEOUT_MS', '30000');
    vi.stubEnv('NVIDIA_MAX_ATTEMPTS', '2');
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(generator().generate(input)).rejects.toThrow(
        'All NVIDIA models failed',
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(timeout.mock.calls[0][0]).toBeLessThanOrEqual(15000);
      expect(timeout.mock.calls[1][0]).toBeLessThanOrEqual(30000);
    } finally {
      timeout.mockRestore();
    }
  });
  it('accepts a valid plan containing only captured course IDs', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        choices: [
          {
            message: {
              content: JSON.stringify({
                title: 'Backend roadmap',
                summary: 'A focused plan',
                items: [{ courseId: 'course-1', reason: 'Matches the goal' }],
              }),
            },
          },
        ],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generator().generate(input);

    expect(result.provider).toBe(RoadmapGeneratorProvider.NVIDIA);
    expect(result.items).toEqual([
      { courseId: 'course-1', reason: 'Matches the goal' },
    ]);
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it('rejects a course ID that was not present in the captured catalog', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Invalid roadmap',
                  summary: 'Contains an invented course',
                  items: [{ courseId: 'invented', reason: 'Invalid' }],
                }),
              },
            },
          ],
        }),
      }),
    );

    await expect(generator().generate(input)).rejects.toThrow(
      'unknown or duplicated course',
    );
  });

  it('tries configured models in order until one returns a valid plan', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'first-model,second-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content: JSON.stringify({
                  title: 'Fallback model roadmap',
                  summary: 'The second model succeeded',
                  items: [{ courseId: 'course-1', reason: 'Matches the goal' }],
                }),
              },
            },
          ],
        }),
      });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generator().generate(input);

    expect(result.version).toBe('nvidia:second-model');
    expect(result.attemptedModels).toEqual(['first-model', 'second-model']);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('accepts JSON surrounded by explanatory text', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  'Here is the requested roadmap:\n```json\n{"title":"Backend roadmap","summary":"A focused plan","items":[{"courseId":"course-1","reason":"Matches the goal"}]}\n```',
              },
            },
          ],
        }),
      }),
    );

    const result = await generator().generate(input);

    expect(result.version).toBe('nvidia:test-model');
    expect(result.items[0]?.courseId).toBe('course-1');
  });

  it('handles braces inside JSON strings while extracting an object', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          choices: [
            {
              message: {
                content:
                  'Result: {"title":"Backend {API}","summary":"A focused plan","items":[{"courseId":"course-1","reason":"Matches the goal"}]} done.',
              },
            },
          ],
        }),
      }),
    );

    await expect(generator().generate(input)).resolves.toMatchObject({
      title: 'Backend {API}',
    });
  });
});
