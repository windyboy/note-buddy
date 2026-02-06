import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

const requestUrlMock = vi.fn();

vi.mock('obsidian', () => ({
  requestUrl: requestUrlMock,
  Notice: class {},
  ItemView: class {},
  WorkspaceLeaf: class {},
}));

function makeSessionResponse() {
  return {
    id: 'ses_test',
    slug: 'test',
    projectID: 'proj',
    directory: '/tmp',
    title: 't',
    version: '0',
    time: { created: 123, updated: 124 },
  };
}

describe('OpenCodeClient (contract-compliant)', () => {
  const mockRequestUrl = requestUrlMock as unknown as ReturnType<typeof vi.fn>;

  beforeEach(() => {
    mockRequestUrl.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('createSession maps Session.id and Session.time.created', async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096');
    const session = await client.createSession();

    expect(session.sessionID).toBe('ses_test');
    expect(session.createTime).toBe(123);
  });

  it('sendMessage sends TextPartInput without role and extracts text parts', async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    });

    const responseBody = {
      info: {
        id: 'msg_assistant',
        sessionID: 'ses_test',
        role: 'assistant',
        time: { created: 200 },
        parentID: 'msg_parent',
        modelID: 'm',
        providerID: 'p',
        mode: 'chat',
        agent: 'default',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      },
      parts: [
        { id: 'p1', sessionID: 'ses_test', messageID: 'msg_assistant', type: 'text', text: 'Hello' },
        { id: 'p2', sessionID: 'ses_test', messageID: 'msg_assistant', type: 'text', text: 'World' },
      ],
    };

    mockRequestUrl.mockImplementationOnce(async (options: { body: string }) => {
      const body = JSON.parse(options.body);
      expect(body.parts).toEqual([{ type: 'text', text: 'hi' }]);
      expect(body.parts[0].role).toBeUndefined();

      return {
        status: 200,
        json: responseBody,
        text: JSON.stringify(responseBody),
      };
    });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096');
    const text = await client.sendMessage('hi');
    expect(text).toBe('Hello\nWorld');
  });

  it('getCapabilities normalizes provider.models map and parses required default', async () => {
    const providersResponse = {
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          source: 'config',
          env: [],
          options: {},
          models: {
            'gpt-4o': { id: 'gpt-4o', name: 'GPT-4o' },
            'gpt-4.1': { id: 'gpt-4.1', name: 'GPT-4.1' },
          },
        },
      ],
      default: { chat: 'openai/gpt-4o' },
    };

    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: providersResponse,
      text: JSON.stringify(providersResponse),
    });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096');
    const providers = await client.getCapabilities(true);

    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe('openai');
    expect(providers[0].models.map((m) => m.id).sort()).toEqual(['gpt-4.1', 'gpt-4o']);
  });

  it('getCapabilities deduplicates in-flight requests', async () => {
    const providersResponse = {
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          source: 'config',
          env: [],
          options: {},
          models: {
            'gpt-4o': { id: 'gpt-4o', name: 'GPT-4o' },
          },
        },
      ],
      default: {},
    };

    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: providersResponse,
      text: JSON.stringify(providersResponse),
    });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096');

    const p1 = client.getCapabilities();
    const p2 = client.getCapabilities();

    const [r1, r2] = await Promise.all([p1, p2]);
    expect(r1).toEqual(r2);
    expect(mockRequestUrl).toHaveBeenCalledTimes(1);
  });

  it('getCapabilities retries transient server failures', async () => {
    const providersResponse = {
      providers: [
        {
          id: 'openai',
          name: 'OpenAI',
          source: 'config',
          env: [],
          options: {},
          models: { 'gpt-4o': { id: 'gpt-4o', name: 'GPT-4o' } },
        },
      ],
      default: {},
    };

    mockRequestUrl
      .mockResolvedValueOnce({ status: 500, json: {}, text: 'server error' })
      .mockResolvedValueOnce({ status: 200, json: providersResponse, text: JSON.stringify(providersResponse) });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096');

    const providers = await client.getCapabilities(true);

    expect(providers[0].id).toBe('openai');
    expect(mockRequestUrl).toHaveBeenCalledTimes(2);
  });

  it('sendMessageAndGetText uses explicit model override when provided', async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    });

    const responseBody = {
      info: {
        id: 'msg_assistant',
        sessionID: 'ses_test',
        role: 'assistant',
        time: { created: 200 },
        parentID: 'msg_parent',
        modelID: 'gpt-4o',
        providerID: 'openai',
        mode: 'chat',
        agent: 'default',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      },
      parts: [{ id: 'p1', sessionID: 'ses_test', messageID: 'msg_assistant', type: 'text', text: 'Hello' }],
    };

    mockRequestUrl.mockImplementationOnce(async (options: { body: string }) => {
      const body = JSON.parse(options.body);
      expect(body.model).toEqual({ providerID: 'openai', modelID: 'gpt-4o' });
      return {
        status: 200,
        json: responseBody,
        text: JSON.stringify(responseBody),
      };
    });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096', 'openai/old-model');

    const text = await client.sendMessageAndGetText('hello', new AbortController().signal, 'openai/gpt-4o');
    expect(text).toBe('Hello');
  });

  it('sendMessageAndGetText omits model when using server default', async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    });

    const responseBody = {
      info: {
        id: 'msg_assistant',
        sessionID: 'ses_test',
        role: 'assistant',
        time: { created: 200 },
        parentID: 'msg_parent',
        modelID: 'server-default',
        providerID: 'server',
        mode: 'chat',
        agent: 'default',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      },
      parts: [{ id: 'p1', sessionID: 'ses_test', messageID: 'msg_assistant', type: 'text', text: 'Default path' }],
    };

    mockRequestUrl.mockImplementationOnce(async (options: { body: string }) => {
      const body = JSON.parse(options.body);
      expect(body.model).toBeUndefined();
      return {
        status: 200,
        json: responseBody,
        text: JSON.stringify(responseBody),
      };
    });

    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096');

    const text = await client.sendMessageAndGetText('hello', new AbortController().signal);
    expect(text).toBe('Default path');
  });

  it('sendMessageAndGetText falls back to server default and calls callback when model is unavailable', async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    });

    mockRequestUrl.mockImplementationOnce(async (options: { body: string }) => {
      const body = JSON.parse(options.body);
      expect(body.model).toEqual({ providerID: 'openai', modelID: 'missing-model' });
      return {
        status: 400,
        json: { success: false, data: null, errors: 'Model not found' },
        text: 'Model not found',
      };
    });

    const responseBody = {
      info: {
        id: 'msg_assistant',
        sessionID: 'ses_test',
        role: 'assistant',
        time: { created: 200 },
        parentID: 'msg_parent',
        modelID: 'server-default',
        providerID: 'server',
        mode: 'chat',
        agent: 'default',
        path: { cwd: '/', root: '/' },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      },
      parts: [{ id: 'p1', sessionID: 'ses_test', messageID: 'msg_assistant', type: 'text', text: 'Recovered' }],
    };
    mockRequestUrl.mockImplementationOnce(async (options: { body: string }) => {
      const body = JSON.parse(options.body);
      expect(body.model).toBeUndefined();
      return {
        status: 200,
        json: responseBody,
        text: JSON.stringify(responseBody),
      };
    });

    const onModelUnavailable = vi.fn();
    const { OpenCodeClient } = await import('../../src/service');
    const client = new OpenCodeClient('http://127.0.0.1:4096', 'openai/missing-model', onModelUnavailable);

    const text = await client.sendMessageAndGetText('hello', new AbortController().signal);

    expect(text).toBe('Recovered');
    expect(onModelUnavailable).toHaveBeenCalledTimes(1);
  });
});
