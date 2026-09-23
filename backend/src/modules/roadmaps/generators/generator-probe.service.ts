import { BadRequestException, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { GeneratorConfigurationService } from './generator-configuration.service.js';
import { nvidiaModelOptions } from './nvidia-model-options.js';

export const PROBE_TIMEOUT_MS = 10_000;
const PROBE_MAX_TOKENS = 32;
export enum ProbeStatus {
  OK = 'OK',
  TIMEOUT = 'TIMEOUT',
  HTTP_ERROR = 'HTTP_ERROR',
  EMPTY_RESPONSE = 'EMPTY_RESPONSE',
  TOKEN_LIMIT = 'TOKEN_LIMIT',
  INVALID_RESPONSE = 'INVALID_RESPONSE',
  CONNECTION_ERROR = 'CONNECTION_ERROR',
}

@Injectable()
export class GeneratorProbeService {
  constructor(private readonly configuration: GeneratorConfigurationService) {}

  async probe(requestedModel?: string) {
    const config = this.configuration.nvidia();
    const model = requestedModel ?? config.models[0];
    if (!config.apiKey || !model || !config.models.includes(model)) {
      throw new BadRequestException(
        'Choose a configured NVIDIA model with an API key.',
      );
    }
    const started = performance.now();
    const signal = AbortSignal.timeout(PROBE_TIMEOUT_MS);
    let status = ProbeStatus.CONNECTION_ERROR;
    let httpStatus: number | null = null;
    try {
      const response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        signal,
        headers: {
          Authorization: `Bearer ${config.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model,
          ...nvidiaModelOptions(model),
          stream: false,
          max_tokens: PROBE_MAX_TOKENS,
          messages: [{ role: 'user', content: 'Reply with only OK.' }],
        }),
      });
      httpStatus = response.status;
      if (!response.ok) {
        status = ProbeStatus.HTTP_ERROR;
        await response.body?.cancel();
      } else {
        const body = (await response.json()) as {
          choices?: Array<{
            finish_reason?: string;
            message?: { content?: unknown };
          }>;
        };
        const content = body?.choices?.[0]?.message?.content;
        status =
          body?.choices?.[0]?.finish_reason === 'length'
            ? ProbeStatus.TOKEN_LIMIT
            : typeof content === 'string' && content.trim() === 'OK'
              ? ProbeStatus.OK
              : typeof content === 'string' && content.trim()
                ? ProbeStatus.INVALID_RESPONSE
                : ProbeStatus.EMPTY_RESPONSE;
      }
    } catch (error) {
      status = signal.aborted
        ? ProbeStatus.TIMEOUT
        : error instanceof SyntaxError
          ? ProbeStatus.INVALID_RESPONSE
          : ProbeStatus.CONNECTION_ERROR;
    }
    return {
      data: {
        provider: 'NVIDIA',
        model,
        status,
        elapsed_ms: Math.round(performance.now() - started),
        timeout_ms: PROBE_TIMEOUT_MS,
        http_status: httpStatus,
        checked_at: new Date().toISOString(),
        generation_guaranteed: false,
      },
    };
  }
}
