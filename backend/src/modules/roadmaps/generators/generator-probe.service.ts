import { BadRequestException, Injectable } from '@nestjs/common';
import { performance } from 'node:perf_hooks';
import { GeneratorConfigurationService } from './generator-configuration.service.js';
import {
  FirstTokenTimeoutError,
  NvidiaHttpError,
  type NvidiaStreamResult,
  streamNvidiaChat,
} from './nvidia-chat-stream.js';
import { nvidiaModelOptions } from './nvidia-model-options.js';

export const PROBE_TIMEOUT_MS = 30_000;
// Enough room for a reasoning model to finish thinking and still answer.
const PROBE_MAX_TOKENS = 512;
export enum ProbeStatus {
  OK = 'OK',
  QUEUED = 'QUEUED',
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

  /**
   * Real minimal call that separates provider queue time from generation time
   * and reports how much the model reasons before answering.
   */
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
    let result: NvidiaStreamResult | null = null;
    try {
      result = await streamNvidiaChat({
        baseUrl: config.baseUrl,
        apiKey: config.apiKey,
        signal,
        firstTokenTimeoutMs: config.firstTokenTimeoutMs,
        body: {
          model,
          ...nvidiaModelOptions(model),
          max_tokens: PROBE_MAX_TOKENS,
          messages: [{ role: 'user', content: 'Reply with only OK.' }],
        },
      });
      httpStatus = 200;
      status =
        result.finishReason === 'length'
          ? ProbeStatus.TOKEN_LIMIT
          : result.content === 'OK'
            ? ProbeStatus.OK
            : result.content
              ? ProbeStatus.INVALID_RESPONSE
              : ProbeStatus.EMPTY_RESPONSE;
    } catch (error) {
      if (error instanceof NvidiaHttpError) {
        status = ProbeStatus.HTTP_ERROR;
        httpStatus = error.status;
      } else if (error instanceof FirstTokenTimeoutError) {
        status = ProbeStatus.QUEUED;
      } else if (signal.aborted) {
        status = ProbeStatus.TIMEOUT;
      } else if (error instanceof SyntaxError) {
        status = ProbeStatus.INVALID_RESPONSE;
      }
    }
    return {
      data: {
        provider: 'NVIDIA',
        model,
        status,
        elapsed_ms: Math.round(performance.now() - started),
        timeout_ms: PROBE_TIMEOUT_MS,
        first_token_timeout_ms: config.firstTokenTimeoutMs,
        queue_ms: result?.queueMs ?? null,
        first_answer_ms: result?.firstAnswerMs ?? null,
        reasoning_chars: result?.reasoningChars ?? null,
        completion_tokens: result?.completionTokens ?? null,
        http_status: httpStatus,
        checked_at: new Date().toISOString(),
        generation_guaranteed: false,
      },
    };
  }
}
