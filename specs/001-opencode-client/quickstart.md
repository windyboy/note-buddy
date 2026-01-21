# Quickstart: Opencode Client Plugin

**Feature**: Opencode Client Interface | **Date**: 2025-01-21

---

## Prerequisites

- Obsidian 1.0+
- Node.js 18+
- Opencode server accessible via HTTPS
- Obsidian vault with markdown notes

---

## Project Structure

```
src/
├── models/          # Data types
│   └── types.ts
├── services/        # Core logic
│   ├── opencode-service.ts
│   ├── vault-service.ts
│   ├── session-service.ts
│   └── query-engine.ts
├── ui/             # UI components
│   ├── chat-view.ts
│   └── settings.ts
└── main.ts          # Plugin entry point
tests/
├── unit/
└── integration/
manifest.json
tsconfig.json
package.json
```

---

## Setup Commands

```bash
# Install dependencies
npm install

# Development mode
npm run dev

# Run tests
npm test

# Build plugin
npm run build
```

---

## Configuration Files

### package.json

```json
{
  "name": "opencode-client",
  "version": "0.1.0",
  "scripts": {
    "dev": "node esbuild.config.mjs",
    "build": "tsc -noEmit -b && node esbuild.config.mjs production",
    "test": "vitest"
  },
  "dependencies": {
    "ky": "^1.0.0",
    "obsidian": "latest"
  },
  "devDependencies": {
    "typescript": "^5.6.0",
    "vitest": "^2.0.0"
  }
}
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "strict": true,
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "lib": ["ES2022", "DOM"],
    "types": ["obsidian"]
  }
}
```

### manifest.json

```json
{
  "id": "opencode-client",
  "name": "Opencode Client",
  "version": "0.1.0",
  "minAppVersion": "1.0.0",
  "description": "Chat with Opencode about your Obsidian notes",
  "author": "Your Name",
  "isDesktopOnly": false
}
```

---

## Implementation Patterns

### main.ts

```typescript
import { Plugin } from 'obsidian';
import { ChatView } from './ui/chat-view';
import { SettingsTab } from './ui/settings';

export default class OpencodePlugin extends Plugin {
  async onload() {
    this.registerView('opencode-chat', leaf => new ChatView(leaf, this));
    this.addRibbonIcon('message-square', 'Open Chat', () => {
      this.activateView();
    });
    this.addSettingTab(new SettingsTab(this.app, this));
  }

  async onunload() {
    // Cleanup
  }
}
```

### chat-view.ts

```typescript
import { ItemView } from 'obsidian';

export class ChatView extends ItemView {
  getViewType() { return 'opencode-chat'; }
  getDisplayText() { return 'Opencode Chat'; }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();
    container.createEl('h2', { text: 'Chat with Opencode' });
    // Add chat UI here
  }
}
```

---

## Testing

### Basic Test

```typescript
import { describe, it, expect, vi } from 'vitest';

describe('Opencode Client', () => {
  it('should connect to server', async () => {
    const client = new OpencodeClient('https://api.opencode.ai', 'test-key');
    const result = await client.healthCheck();
    expect(result.status).toBe('success');
  });
});
```

---

## Development Workflow

1. Make code changes
2. Run `npm run dev` to build
3. Reload Obsidian plugin
4. Test functionality
5. Run `npm test` for tests

---

## Notes

- Use TypeScript strict mode
- All API calls should be in services
- UI should delegate to services
- Test with Vitest using mock APIs
