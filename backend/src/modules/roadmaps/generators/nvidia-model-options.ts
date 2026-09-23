/** Provider-specific options belong here, not in the shared generator contract. */
export function nvidiaModelOptions(model: string): Record<string, unknown> {
  if (model === 'nvidia/nemotron-3.5-lightning-30b-a3b') {
    return { chat_template_kwargs: { enable_thinking: false } };
  }
  return {};
}
