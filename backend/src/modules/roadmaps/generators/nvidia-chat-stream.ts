import { performance } from 'node:perf_hooks';

/** No chunk arrived in time: the request is most likely waiting in the provider queue. */
export class FirstTokenTimeoutError extends Error {
  override name = 'FirstTokenTimeoutError';
  constructor(timeoutMs: number) {
    super(`No response started within ${timeoutMs} ms (provider queue).`);
  }
}

export class NvidiaHttpError extends Error {
  override name = 'NvidiaHttpError';
  constructor(readonly status: number) {
    super(`NVIDIA request failed with HTTP ${status}.`);
  }

  /** Rate limits and gateway errors are transient on the shared hosted API. */
  get retryable(): boolean {
    return this.status === 429 || this.status >= 500;
  }
}

export interface NvidiaStreamRequest {
  baseUrl: string;
  apiKey: string;
  body: Record<string, unknown>;
  signal: AbortSignal;
  firstTokenTimeoutMs: number;
}

export interface NvidiaStreamResult {
  content: string;
  reasoningChars: number;
  finishReason: string | null;
  completionTokens: number | null;
  promptTokens: number | null;
  queueMs: number;
  firstAnswerMs: number | null;
  totalMs: number;
}

interface StreamChunk {
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  choices?: Array<{
    finish_reason?: string | null;
    delta?: {
      content?: string | null;
      reasoning_content?: string | null;
      reasoning?: string | null;
    };
  }>;
}

const THINK_BLOCK = /<think>[\s\S]*?<\/think>/g;
const THINK_END = '</think>';

/**
 * Some templates (GLM-5.3 on vLLM) leak the scratchpad into the answer, even
 * with only a dangling closing tag; keep what follows the last one.
 */
export function stripReasoning(content: string): string {
  const withoutBlocks = content.replace(THINK_BLOCK, '');
  const end = withoutBlocks.lastIndexOf(THINK_END);
  return (
    end >= 0 ? withoutBlocks.slice(end + THINK_END.length) : withoutBlocks
  ).trim();
}

/**
 * Streams a chat completion so queue time (no first chunk yet) can be told
 * apart from generation time, and reasoning output is kept out of the answer.
 */
export async function streamNvidiaChat(
  request: NvidiaStreamRequest,
): Promise<NvidiaStreamResult> {
  const started = performance.now();
  const firstToken = new AbortController();
  const timer = setTimeout(
    () =>
      firstToken.abort(new FirstTokenTimeoutError(request.firstTokenTimeoutMs)),
    request.firstTokenTimeoutMs,
  );
  const signal = AbortSignal.any([request.signal, firstToken.signal]);
  let queueMs: number | null = null;
  let firstAnswerMs: number | null = null;
  let content = '';
  let reasoningChars = 0;
  let finishReason: string | null = null;
  let completionTokens: number | null = null;
  let promptTokens: number | null = null;
  try {
    const response = await fetch(`${request.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${request.apiKey}`,
        'Content-Type': 'application/json',
      },
      signal,
      body: JSON.stringify({
        ...request.body,
        stream: true,
        stream_options: { include_usage: true },
      }),
    });
    if (!response.ok) {
      await response.body?.cancel();
      throw new NvidiaHttpError(response.status);
    }
    if (!response.body) throw new Error('NVIDIA returned an empty response.');
    const decoder = new TextDecoder();
    let buffer = '';
    for await (const bytes of response.body) {
      if (queueMs === null) {
        queueMs = performance.now() - started;
        clearTimeout(timer);
      }
      buffer += decoder.decode(bytes, { stream: true });
      const lines = buffer.split('\n');
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        const data = line.startsWith('data:') ? line.slice(5).trim() : '';
        if (!data || data === '[DONE]') continue;
        const chunk = JSON.parse(data) as StreamChunk;
        if (chunk.usage) {
          promptTokens = chunk.usage.prompt_tokens ?? promptTokens;
          completionTokens = chunk.usage.completion_tokens ?? completionTokens;
        }
        const choice = chunk.choices?.[0];
        if (!choice) continue;
        finishReason = choice.finish_reason ?? finishReason;
        const delta = choice.delta ?? {};
        reasoningChars += (delta.reasoning_content ?? delta.reasoning ?? '')
          .length;
        if (delta.content) {
          firstAnswerMs ??= performance.now() - started;
          content += delta.content;
        }
      }
    }
  } catch (error) {
    if (firstToken.signal.aborted && !request.signal.aborted)
      throw firstToken.signal.reason as FirstTokenTimeoutError;
    throw error;
  } finally {
    clearTimeout(timer);
  }
  return {
    content: stripReasoning(content),
    reasoningChars,
    finishReason,
    completionTokens,
    promptTokens,
    queueMs: Math.round(queueMs ?? performance.now() - started),
    firstAnswerMs: firstAnswerMs === null ? null : Math.round(firstAnswerMs),
    totalMs: Math.round(performance.now() - started),
  };
}
