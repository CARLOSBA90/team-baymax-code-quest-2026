import { GeneratorConfigurationService } from './generator-configuration.service.js';
import {
  GeneratorProbeService,
  ProbeStatus,
} from './generator-probe.service.js';

describe('GeneratorProbeService', () => {
  it('does not mistake truncated reasoning for a successful probe', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue({
          ok: true,
          status: 200,
          json: async () => ({
            choices: [
              {
                finish_reason: 'length',
                message: { content: 'Still thinking' },
              },
            ],
          }),
        }),
    );
    const result = await service().probe('test-model');
    expect(result.data.status).toBe(ProbeStatus.TOKEN_LIMIT);
  });
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

  it.each([
    [
      {
        ok: true,
        status: 200,
        json: async () => ({ choices: [{ message: { content: 'OK' } }] }),
      },
      ProbeStatus.OK,
    ],
    [
      { ok: true, status: 200, json: async () => ({ choices: [] }) },
      ProbeStatus.EMPTY_RESPONSE,
    ],
    [{ ok: false, status: 401 }, ProbeStatus.HTTP_ERROR],
  ])(
    'classifies the provider response without exposing secrets',
    async (response, status) => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue(response));
      const result = await service().probe('test-model');
      expect(result.data.status).toBe(status);
      expect(result.data.generation_guaranteed).toBe(false);
      expect(JSON.stringify(result)).not.toContain('secret-test-key');
    },
  );

  it('rejects unconfigured models without contacting the provider', async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal('fetch', fetchMock);
    await expect(service().probe('unknown')).rejects.toThrow(
      'configured NVIDIA model',
    );
    expect(fetchMock).not.toHaveBeenCalled();
  });
});
