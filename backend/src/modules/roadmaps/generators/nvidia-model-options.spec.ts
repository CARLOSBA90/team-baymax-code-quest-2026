import { nvidiaModelOptions } from './nvidia-model-options.js';

describe('nvidiaModelOptions', () => {
  it('disables thinking for the supported Nemotron model', () => {
    expect(nvidiaModelOptions('nvidia/nemotron-3.5-lightning-30b-a3b')).toEqual(
      { chat_template_kwargs: { enable_thinking: false } },
    );
  });
  it.each(['z-ai/glm-5.3', 'openai/gpt-oss-20b'])(
    'lowers reasoning effort for %s, whose thinking cannot be disabled',
    (model) => {
      expect(nvidiaModelOptions(model)).toEqual({ reasoning_effort: 'low' });
    },
  );
  it('does not send unsupported parameters to other models', () => {
    expect(nvidiaModelOptions('another-model')).toEqual({});
  });
});
