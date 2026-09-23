import { nvidiaModelOptions } from './nvidia-model-options.js';

describe('nvidiaModelOptions', () => {
  it('disables thinking for the supported Nemotron model', () => {
    expect(nvidiaModelOptions('nvidia/nemotron-3.5-lightning-30b-a3b')).toEqual(
      { chat_template_kwargs: { enable_thinking: false } },
    );
  });
  it('does not send unsupported parameters to other models', () => {
    expect(nvidiaModelOptions('another-model')).toEqual({});
  });
});
