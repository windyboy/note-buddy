import { describe, it, expect, vi } from 'vitest';
import { ChatView, VIEW_TYPE_CHAT } from '../../src/chat-view';
import { Provider } from '../../src/models';
import NoteBuddyPlugin from '../../src/main';

function createPluginMock(overrides: Partial<NoteBuddyPlugin> = {}): NoteBuddyPlugin {
  return {
    pluginData: {
      serviceUrl: 'http://127.0.0.1:4096',
      defaultModelId: undefined,
      tokenBudget: 100000,
      sessions: [],
      activeSessionId: undefined,
    },
    savePluginData: vi.fn().mockResolvedValue(undefined),
    changeModel: vi.fn().mockResolvedValue(undefined),
    onModelUnavailable: vi.fn(),
    ...overrides,
  } as unknown as NoteBuddyPlugin;
}

describe('ChatView', () => {
  it('returns the expected view type constant', () => {
    const view = new ChatView({} as never, createPluginMock());
    expect(view.getViewType()).toBe(VIEW_TYPE_CHAT);
  });

  it('resolveSelectedModelId returns undefined for server default and malformed values', () => {
    const plugin = createPluginMock();
    const view = new ChatView({} as never, plugin) as unknown as {
      modelSelect: { value: string };
      resolveSelectedModelId: () => string | undefined;
    };

    view.modelSelect = { value: '' };
    expect(view.resolveSelectedModelId()).toBeUndefined();

    view.modelSelect = { value: 'default' };
    expect(view.resolveSelectedModelId()).toBeUndefined();
  });

  it('resolveSelectedModelId returns explicit provider/model value', () => {
    const plugin = createPluginMock();
    const view = new ChatView({} as never, plugin) as unknown as {
      modelSelect: { value: string };
      resolveSelectedModelId: () => string | undefined;
    };
    view.modelSelect = { value: 'openai/gpt-4o' };

    expect(view.resolveSelectedModelId()).toBe('openai/gpt-4o');
  });

  it('isModelAvailable validates provider/model combinations', () => {
    const plugin = createPluginMock();
    const view = new ChatView({} as never, plugin) as unknown as {
      isModelAvailable: (modelId: string, providers: Provider[]) => boolean;
    };
    const providers: Provider[] = [
      { id: 'openai', name: 'OpenAI', models: [{ id: 'gpt-4o', name: 'GPT-4o' }] },
    ];

    expect(view.isModelAvailable('openai/gpt-4o', providers)).toBe(true);
    expect(view.isModelAvailable('openai/gpt-5', providers)).toBe(false);
    expect(view.isModelAvailable('anthropic/claude', providers)).toBe(false);
  });
});
