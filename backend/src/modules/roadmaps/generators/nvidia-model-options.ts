/**
 * Per-model request options. Selecting courses does not need long reasoning,
 * and a reasoning model can spend the whole token budget before answering.
 * - Nemotron 3.5 Lightning honours `enable_thinking: false`.
 * - GLM-5.3 and gpt-oss cannot disable thinking: their templates only read
 *   `reasoning_effort` (GLM-5.3 ignores `enable_thinking` entirely).
 */
const MODEL_OPTIONS: Record<string, Record<string, unknown>> = {
  'nvidia/nemotron-3.5-lightning-30b-a3b': {
    chat_template_kwargs: { enable_thinking: false },
  },
  'z-ai/glm-5.3': { reasoning_effort: 'low' },
  'z-ai/glm-5.3-flash': { reasoning_effort: 'low' },
  'openai/gpt-oss-20b': { reasoning_effort: 'low' },
};

/** Provider-specific options belong here, not in the shared generator contract. */
export function nvidiaModelOptions(model: string): Record<string, unknown> {
  return MODEL_OPTIONS[model] ?? {};
}
