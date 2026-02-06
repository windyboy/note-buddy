import { describe, it, expect } from 'vitest';
import { buildModelOptions } from '../../src/utils/model-options';

describe('buildModelOptions', () => {
  it('always includes server default and flattens provider models', () => {
    const options = buildModelOptions([
      {
        id: 'openai',
        name: 'OpenAI',
        models: [
          { id: 'gpt-4o', name: 'GPT-4o' },
          { id: 'gpt-4.1', name: 'GPT-4.1' },
        ],
      },
      {
        id: 'anthropic',
        name: 'Anthropic',
        models: [{ id: 'claude-sonnet', name: 'Claude Sonnet' }],
      },
    ]);

    expect(options['']).toBe('Use server default');
    expect(options['openai/gpt-4o']).toBe('OpenAI - GPT-4o');
    expect(options['openai/gpt-4.1']).toBe('OpenAI - GPT-4.1');
    expect(options['anthropic/claude-sonnet']).toBe('Anthropic - Claude Sonnet');
  });

  it('returns only server default option for empty providers', () => {
    expect(buildModelOptions([])).toEqual({
      '': 'Use server default',
    });
  });
});
