import { GeneratorConfigurationService } from './generator-configuration.service.js';
import {
  GeneratorProbeService,
  ProbeStatus,
} from './generator-probe.service.js';

const sse = (...chunks: unknown[]) =>
  new Response(
    `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('')}data: [DONE]\n\n`,
  );

describe('GeneratorProbeService', () => {
  beforeEach(() => {
    vi.stubEnv('NVIDIA_API_KEY', 'secret-test-key');
    vi.stubEnv('NVIDIA_MODELS', 'test-model');
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.unstubAllEnvs();
  });
  const service = () =>
    new GeneratorProbeService(new GeneratorConfigurationService());

  it('does not mistake truncated reasoning for a successful probe', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue(
        sse({
          choices: [
            {
              delta: { reasoning_content: 'Still thinking' },
              finish_reason: 'length',
            },
          ],
        }),
      ),
    );
    const result = await service().probe('test-model');
    expect(result.data.status).toBe(ProbeStatus.TOKEN_LIMIT);
    expect(result.data.reasoning_chars).toBe('Still thinking'.length);
  });

  it.each([
    [() => sse({ choices: [{ delta: { content: 'OK' } }] }), ProbeStatus.OK],
    [() => sse({ choices: [] }), ProbeStatus.EMPTY_RESPONSE],
    [() => new Response(null, { status: 401 }), ProbeStatus.HTTP_ERROR],
  ])(
    'classifies the provider response without exposing secrets',
    async (response, status) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response()));
      const result = await service().probe('test-model');
      expect(result.data.status).toBe(status);
      expect(result.data.generation_guaranteed).toBe(false);
      expect(JSON.stringify(result)).not.toContain('secret-test-key');
    },
  );

  it('reports a request stuck in the provider queue', async () => {
    vi.stubEnv('NVIDIA_FIRST_TOKEN_TIMEOUT_MS', '20');
    vi.stubGlobal(
      'fetch',
      vi.fn(
        (_url: string, options: RequestInit) =>
          new Promise((_resolve, reject) =>
            options.signal!.addEventListener(
              'abort',
              () => reject(options.signal!.reason),
              { once: true },
            ),
          ),
      ),
    );
    const result = await service().probe('test-model');
    expect(result.data.status).toBe(ProbeStatus.QUEUED);
    expect(result.data.queue_ms).toBeNull();
  });

  it('rejects unconfigured models without contacting the provider', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(service().probe('unknown')).rejects.toThrow(
      'configured NVIDIA model',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
