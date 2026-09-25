import { Injectable } from '@nestjs/common';
const DEFAULT_TOTAL_TIMEOUT_MS = 30_000;
const MAX_TOTAL_TIMEOUT_MS = 120_000;
const DEFAULT_MODEL_ATTEMPTS = 2;
const MAX_MODEL_ATTEMPTS = 4;
const DEFAULT_FIRST_TOKEN_TIMEOUT_MS = 10_000;
const MAX_FIRST_TOKEN_TIMEOUT_MS = 60_000;
const DEFAULT_QUEUE_RETRIES = 2;
const MAX_QUEUE_RETRIES = 5;
import {
  EMPTY_COLLECTION_SIZE,
  NVIDIA_DEFAULT_BASE_URL,
  NVIDIA_DEFAULT_TIMEOUT_MS,
  RoadmapGenerationMode,
  RoadmapGeneratorProvider,
} from '../roadmap.constants.js';

@Injectable()
export class GeneratorConfigurationService {
  providerChain(mode: RoadmapGenerationMode): string[] {
    if (mode === RoadmapGenerationMode.DETERMINISTIC) {
      return [RoadmapGeneratorProvider.RULES];
    }

    const primary =
      mode === RoadmapGenerationMode.AI
        ? RoadmapGeneratorProvider.NVIDIA
        : (this.providerName(process.env.ROADMAP_GENERATOR_PROVIDER) ??
          RoadmapGeneratorProvider.RULES);
    const fallbacks = this.csv(process.env.ROADMAP_GENERATOR_FALLBACKS);
    return this.unique([primary, ...fallbacks, RoadmapGeneratorProvider.RULES]);
  }

  nvidia() {
    const models = this.unique([
      ...this.csv(process.env.NVIDIA_MODELS),
      ...(process.env.NVIDIA_MODEL?.trim()
        ? [process.env.NVIDIA_MODEL.trim()]
        : []),
    ]);
    const configuredTimeout = Number(process.env.NVIDIA_TIMEOUT_MS);
    return {
      apiKey: process.env.NVIDIA_API_KEY?.trim() ?? '',
      baseUrl: (
        process.env.NVIDIA_BASE_URL?.trim() || NVIDIA_DEFAULT_BASE_URL
      ).replace(/\/$/, ''),
      models,
      totalTimeoutMs: this.positiveInteger(
        process.env.NVIDIA_TOTAL_TIMEOUT_MS,
        DEFAULT_TOTAL_TIMEOUT_MS,
        MAX_TOTAL_TIMEOUT_MS,
      ),
      maxAttempts: this.positiveInteger(
        process.env.NVIDIA_MAX_ATTEMPTS,
        DEFAULT_MODEL_ATTEMPTS,
        MAX_MODEL_ATTEMPTS,
      ),
      timeoutMs:
        Number.isFinite(configuredTimeout) &&
        configuredTimeout > EMPTY_COLLECTION_SIZE
          ? configuredTimeout
          : NVIDIA_DEFAULT_TIMEOUT_MS,
      firstTokenTimeoutMs: this.positiveInteger(
        process.env.NVIDIA_FIRST_TOKEN_TIMEOUT_MS,
        DEFAULT_FIRST_TOKEN_TIMEOUT_MS,
        MAX_FIRST_TOKEN_TIMEOUT_MS,
      ),
      queueRetries: this.nonNegativeInteger(
        process.env.NVIDIA_QUEUE_RETRIES,
        DEFAULT_QUEUE_RETRIES,
        MAX_QUEUE_RETRIES,
      ),
    };
  }

  publicConfiguration() {
    const nvidia = this.nvidia();
    return {
      default_mode: RoadmapGenerationMode.AUTO,
      provider_chain: this.providerChain(RoadmapGenerationMode.AUTO),
      nvidia: {
        available: Boolean(nvidia.apiKey && nvidia.models.length),
        base_url: nvidia.baseUrl,
        models: nvidia.models,
        timeout_ms: nvidia.timeoutMs,
        total_timeout_ms: nvidia.totalTimeoutMs,
        max_attempts: nvidia.maxAttempts,
        first_token_timeout_ms: nvidia.firstTokenTimeoutMs,
        queue_retries: nvidia.queueRetries,
      },
    };
  }

  private csv(value: string | undefined): string[] {
    return (value ?? '')
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  private positiveInteger(
    value: string | undefined,
    fallback: number,
    maximum: number,
  ): number {
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed > 0
      ? Math.min(parsed, maximum)
      : fallback;
  }

  private nonNegativeInteger(
    value: string | undefined,
    fallback: number,
    maximum: number,
  ): number {
    if (value === undefined || value.trim() === '') return fallback;
    const parsed = Number(value);
    return Number.isSafeInteger(parsed) && parsed >= 0
      ? Math.min(parsed, maximum)
      : fallback;
  }

  private providerName(value: string | undefined): string | null {
    const provider = value?.trim().toUpperCase();
    return provider || null;
  }

  private unique(values: string[]): string[] {
    return [...new Set(values)];
  }
}
