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

/** Builds the SSE body the NVIDIA API streams for a chat completion. */
function chatResponse(content: string): Response {
  const chunk = { choices: [{ delta: { content }, finish_reason: 'stop' }] };
  return new Response(
    `data: ${JSON.stringify(chunk)}

data: [DONE]

`,
    {
      status: 200,
    },
  );
}

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

  it('caps parallel models and gives each one the total budget', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'first,second,third,fourth');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_TIMEOUT_MS', '150000');
    vi.stubEnv('NVIDIA_TOTAL_TIMEOUT_MS', '30000');
    vi.stubEnv('NVIDIA_MAX_ATTEMPTS', '2');
    vi.stubEnv('NVIDIA_QUEUE_RETRIES', '0');
    const timeout = vi.spyOn(AbortSignal, 'timeout');
    const fetchMock = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    vi.stubGlobal('fetch', fetchMock);
    try {
      await expect(generator().generate(input)).rejects.toThrow(
        'All NVIDIA models failed (first: NVIDIA request failed with HTTP 503.; second:',
      );
      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(timeout.mock.calls.map(([ms]) => ms)).toEqual([30000, 30000]);
    } finally {
      timeout.mockRestore();
    }
  });

  it('returns the fastest valid plan and aborts the slower models', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'slow-model,fast-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_MAX_ATTEMPTS', '2');
    const fetchMock = vi.fn((_url: string, options: RequestInit) => {
      const { model } = JSON.parse(options.body as string) as {
        model: string;
      };
      if (model === 'fast-model')
        return Promise.resolve(
          chatResponse(
            JSON.stringify({
              title: 'Fast roadmap',
              summary: 'The fastest model wins',
              items: [{ ref: 'c1', title: 'APIs', reason: 'Matches' }],
            }),
          ),
        );
      return new Promise((_resolve, reject) =>
        options.signal!.addEventListener(
          'abort',
          () => reject(options.signal!.reason),
          { once: true },
        ),
      );
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await generator().generate(input);

    expect(result.version).toBe('nvidia:fast-model');
    expect(result.attemptedModels).toEqual(['slow-model', 'fast-model']);
    expect(fetchMock.mock.calls[0][1].signal?.aborted).toBe(true);
  });

  it('waits for another model when the first answer is invalid', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'broken-model,good-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_MAX_ATTEMPTS', '2');
    const answer = (content: string) => chatResponse(content);
    vi.stubGlobal(
      'fetch',
      vi.fn((_url: string, options: RequestInit) =>
        (JSON.parse(options.body as string) as { model: string }).model ===
        'broken-model'
          ? Promise.resolve(answer('not json'))
          : new Promise((resolve) =>
              setTimeout(
                () =>
                  resolve(
                    answer(
                      JSON.stringify({
                        title: 'Good roadmap',
                        summary: 'Valid plan',
                        items: [
                          { ref: 'c1', title: 'APIs', reason: 'Matches' },
                        ],
                      }),
                    ),
                  ),
                10,
              ),
            ),
      ),
    );

    await expect(generator().generate(input)).resolves.toMatchObject({
      version: 'nvidia:good-model',
    });
  });
  it('accepts a valid plan containing only captured course IDs', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    const fetchMock = vi.fn().mockResolvedValue(
      chatResponse(
        JSON.stringify({
          title: 'Backend roadmap',
          summary: 'A focused plan',
          items: [{ ref: 'c1', title: 'APIs', reason: 'Matches the goal' }],
        }),
      ),
    );
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
      vi.fn().mockResolvedValue(
        chatResponse(
          JSON.stringify({
            title: 'Invalid roadmap',
            summary: 'Contains an invented course',
            items: [{ ref: 'c9', title: 'Invented', reason: 'Invalid' }],
          }),
        ),
      ),
    );

    await expect(generator().generate(input)).rejects.toThrow(
      'unknown or duplicated course',
    );
  });

  it('tries configured models in order until one returns a valid plan', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'first-model,second-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_QUEUE_RETRIES', '0');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 503 })
      .mockResolvedValueOnce(
        chatResponse(
          JSON.stringify({
            title: 'Fallback model roadmap',
            summary: 'The second model succeeded',
            items: [{ ref: 'c1', title: 'APIs', reason: 'Matches the goal' }],
          }),
        ),
      );
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
      vi
        .fn()
        .mockResolvedValue(
          chatResponse(
            'Here is the requested roadmap:\n```json\n{"title":"Backend roadmap","summary":"A focused plan","items":[{"ref":"c1","title":"APIs","reason":"Matches the goal"}]}\n```',
          ),
        ),
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
      vi
        .fn()
        .mockResolvedValue(
          chatResponse(
            'Result: {"title":"Backend {API}","summary":"A focused plan","items":[{"ref":"c1","title":"APIs","reason":"Matches the goal"}]} done.',
          ),
        ),
    );

    await expect(generator().generate(input)).resolves.toMatchObject({
      title: 'Backend {API}',
    });
  });
  it('retries a model whose request stays in the provider queue', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'queued-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_FIRST_TOKEN_TIMEOUT_MS', '20');
    vi.stubEnv('NVIDIA_QUEUE_RETRIES', '1');
    const plan = JSON.stringify({
      title: 'Retried roadmap',
      summary: 'Second request started streaming',
      items: [{ ref: 'c1', title: 'APIs', reason: 'Matches' }],
    });
    const fetchMock = vi
      .fn()
      .mockImplementationOnce(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) =>
            options.signal!.addEventListener(
              'abort',
              () => reject(options.signal!.reason),
              { once: true },
            ),
          ),
      )
      .mockResolvedValueOnce(chatResponse(plan));
    vi.stubGlobal('fetch', fetchMock);

    const result = await generator().generate(input);

    expect(result.title).toBe('Retried roadmap');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('retries rate limits but not client errors', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'limited-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    vi.stubEnv('NVIDIA_QUEUE_RETRIES', '2');
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(new Response(null, { status: 429 }))
      .mockResolvedValueOnce(new Response(null, { status: 400 }));
    vi.stubGlobal('fetch', fetchMock);

    await expect(generator().generate(input)).rejects.toThrow('HTTP 400');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it('ignores reasoning and reports a model that spends all tokens thinking', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODELS', 'thinking-model');
    vi.stubEnv('NVIDIA_MODEL', '');
    const chunk = {
      choices: [
        {
          delta: { reasoning_content: 'still thinking' },
          finish_reason: 'length',
        },
      ],
    };
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        new Response(`data: ${JSON.stringify(chunk)}

data: [DONE]

`),
      ),
    );

    await expect(generator().generate(input)).rejects.toThrow(
      'spent the token limit before answering',
    );
  });

  it('sends short references instead of course IDs and maps them back', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    const fetchMock = vi.fn().mockResolvedValue(
      chatResponse(
        JSON.stringify({
          title: 'Backend roadmap',
          summary: 'A focused plan',
          items: [{ ref: 'c1', title: 'APIs', reason: 'Matches the goal' }],
        }),
      ),
    );
    vi.stubGlobal('fetch', fetchMock);

    const result = await generator().generate(input);

    const prompt = JSON.parse(fetchMock.mock.calls[0][1].body as string)
      .messages[1].content as string;
    expect(prompt).toContain('"ref":"c1"');
    expect(prompt).not.toContain('course-1');
    expect(result.items[0]?.courseId).toBe('course-1');
  });

  it('rejects a plan whose reason belongs to another course', async () => {
    vi.stubEnv('NVIDIA_API_KEY', 'test-key');
    vi.stubEnv('NVIDIA_MODEL', 'test-model');
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        chatResponse(
          JSON.stringify({
            title: 'Mixed roadmap',
            summary: 'Reason attached to the wrong course',
            items: [
              { ref: 'c1', title: 'Django para Python', reason: 'Django' },
            ],
          }),
        ),
      ),
    );

    await expect(generator().generate(input)).rejects.toThrow(
      'title that does not match its reference',
    );
  });

  it('ranks candidates by meaningful goal words, not filler words', () => {
    const base = input.candidates[0];
    const compact = compactGenerationContext({
      ...input,
      goalDescription: 'Quiero aprender APIs backend con Node',
      candidates: [
        {
          ...base,
          id: 'php',
          title: 'PHP',
          description: 'Aprender con proyectos',
        },
        { ...base, id: 'node', title: 'Node.js', description: 'Runtime' },
      ],
    });

    expect(compact.candidates.map(({ id }) => id)).toEqual(['node', 'php']);
  });
});
