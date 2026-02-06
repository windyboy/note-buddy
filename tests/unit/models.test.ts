import { describe, it, expect } from 'vitest';
import { MAX_MESSAGES_PER_SESSION, trimSessionMessages, ChatMessage } from '../../src/models';

function makeMessage(index: number): ChatMessage {
  return {
    id: `m-${index}`,
    role: 'user',
    content: `content-${index}`,
    timestamp: index,
  };
}

describe('models', () => {
  it('trimSessionMessages keeps most recent messages when limit exceeded', () => {
    const messages = Array.from({ length: MAX_MESSAGES_PER_SESSION + 5 }, (_, i) => makeMessage(i + 1));

    const trimmed = trimSessionMessages(messages);

    expect(trimmed).toHaveLength(MAX_MESSAGES_PER_SESSION);
    expect(trimmed[0].id).toBe('m-6');
    expect(trimmed[trimmed.length - 1].id).toBe(`m-${MAX_MESSAGES_PER_SESSION + 5}`);
  });
});
