import {
  FirstTokenTimeoutError,
  stripReasoning,
  streamNvidiaChat,
} from './nvidia-chat-stream.js';

const sse = (...chunks: unknown[]) =>
  new Response(
    `${chunks.map((chunk) => `data: ${JSON.stringify(chunk)}\n\n`).join('')}data: [DONE]\n\n`,
  );

const request = (firstTokenTimeoutMs = 1_000) => ({
  baseUrl: 'https://nvidia.test/v1',
  apiKey: 'secret',
  body: { model: 'test-model' },
  signal: new AbortController().signal,
  firstTokenTimeoutMs,
});

afterEach(() => vi.unstubAllGlobals());

describe('streamNvidiaChat', () => {
  it('separates reasoning from the answer and reads usage', async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(
        sse(
          { choices: [{ delta: { reasoning_content: 'hmm' } }] },
          { choices: [{ delta: { content: '{"a":' } }] },
          { choices: [{ delta: { content: '1}' }, finish_reason: 'stop' }] },
          { choices: [], usage: { prompt_tokens: 10, completion_tokens: 5 } },
        ),
      );
    vi.stubGlobal('fetch', fetchMock);

    const result = await streamNvidiaChat(request());

    expect(result).toMatchObject({
      content: '{"a":1}',
      reasoningChars: 3,
      finishReason: 'stop',
      promptTokens: 10,
      completionTokens: 5,
    });
    expect(result.firstAnswerMs).not.toBeNull();
    expect(JSON.parse(fetchMock.mock.calls[0][1].body)).toMatchObject({
      stream: true,
      stream_options: { include_usage: true },
    });
  });

  it('fails fast when no chunk arrives within the first-token timeout', async () => {
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

    await expect(streamNvidiaChat(request(20))).rejects.toBeInstanceOf(
      FirstTokenTimeoutError,
    );
  });
});

describe('stripReasoning', () => {
  it('removes complete think blocks', () => {
    expect(stripReasoning('<think>plan</think>\n{"ok":true}')).toBe(
      '{"ok":true}',
    );
  });

  it('drops a scratchpad leaked with only a closing tag', () => {
    expect(stripReasoning('I should pick courses...</think>{"ok":true}')).toBe(
      '{"ok":true}',
    );
  });
});
