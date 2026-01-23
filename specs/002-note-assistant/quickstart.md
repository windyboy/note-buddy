# Quickstart Guide - Note Assistant Plugin

**Date**: 2026-01-23
**Purpose**: Fast-path implementation guide for developers

## Prerequisites

- Bun runtime installed
- Obsidian installed (for testing)
- OpenCode service running locally (default: localhost:8000)
- Basic understanding of Obsidian Plugin API

---

## Project Setup

### 1. Initialize Development Environment

```bash
# Install dependencies
bun install

# Verify Bun version
bun --version

# Run tests
bun test
```

### 2. Configure OpenCode Service

Ensure OpenCode service is running:
```bash
# Test connection
curl http://localhost:8000/global/health

# Expected response: {"healthy": true, "version": "1.0.0"}
```

---

## Implementation Order

Follow this sequence for fastest path to working plugin:

### Phase 1: Core Infrastructure (P0)
1. Plugin class with settings
2. OpenCode API client
3. Operation queue
4. Session manager

### Phase 2: First Operation (P1)
5. Summarize command (simplest operation)
6. Basic inline annotations
7. Accept/reject handlers

### Phase 3: Remaining Operations (P1-P2)
8. Extract tasks command
9. Improve structure command
10. Suggest links command

### Phase 4: Polish (P2)
11. Error handling
12. Loading indicators
13. Settings UI

---

## Key Code Snippets

### Plugin Main Class

```typescript
// src/plugin.ts
import { Plugin } from 'obsidian';
import { NoteAssistantSettings, DEFAULT_SETTINGS } from './models/settings';
import { OpenCodeClient } from './services/opencode-client';
import { OperationQueue } from './services/operation-queue';
import { SessionManager } from './services/session-manager';

export default class NoteAssistantPlugin extends Plugin {
  settings: NoteAssistantSettings;
  opencodeClient: OpenCodeClient;
  operationQueue: OperationQueue;
  sessionManager: SessionManager;

  async onload() {
    await this.loadSettings();
    
    // Initialize services
    this.opencodeClient = new OpenCodeClient(this.settings.opencodeEndpoint);
    this.operationQueue = new OperationQueue(this.opencodeClient);
    this.sessionManager = new SessionManager();
    
    // Register commands
    this.registerCommands();
    
    // Add settings tab
    this.addSettingTab(new NoteAssistantSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }

  registerCommands() {
    this.addCommand({
      id: 'summarize-note',
      name: 'Note Assistant: Summarize',
      editorCallback: (editor, view) => {
        this.operationQueue.enqueue({
          type: 'summarize',
          editor,
          view
        });
      }
    });
    // ... other commands
  }
}
```

---

### OpenCode API Client

```typescript
// src/services/opencode-client.ts
export class OpenCodeClient {
  constructor(
    private endpoint: string,
    private apiKey: string = '' // TODO: Implement API key configuration in future iteration
  ) {}

  async createSession(): Promise<string> {
    const response = await fetch(`${this.endpoint}/session`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        title: 'Note Assistant',
        permission: {
          read: { '*': 'deny' },
          edit: { '*': 'deny' },
          bash: { '*': 'deny' }
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to create session: ${response.statusText}`);
    }

    const session = await response.json();
    return session.id;
  }

  async sendMessage(sessionId: string, prompt: string): Promise<string> {
    const response = await fetch(`${this.endpoint}/session/${sessionId}/message`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        parts: [{ type: 'text', text: prompt }]
      })
    });

    if (!response.ok) {
      throw new Error(`Failed to send message: ${response.statusText}`);
    }

    const result = await response.json();
    const textParts = result.parts.filter(p => p.type === 'text');
    return textParts.map(p => p.text).join('\n');
  }

  async deleteSession(sessionId: string): Promise<void> {
    await fetch(`${this.endpoint}/session/${sessionId}`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${this.apiKey}` }
    });
  }
}
```

---

### Operation Queue

```typescript
// src/services/operation-queue.ts
export class OperationQueue {
  private queue: QueuedOperation[] = [];
  private processing = false;

  constructor(private client: OpenCodeClient) {}

  async enqueue(operation: Operation) {
    this.queue.push(operation);
    if (!this.processing) {
      await this.processQueue();
    }
  }

  private async processQueue() {
    this.processing = true;
    while (this.queue.length > 0) {
      const op = this.queue.shift();
      try {
        await this.executeOperation(op);
      } catch (error) {
        console.error('Operation failed:', error);
      }
    }
    this.processing = false;
  }
}
```

---

### Inline Annotations

```typescript
// src/ui/annotations.ts
import { EditorView, Decoration, WidgetType } from '@codemirror/view';

class AnnotationWidget extends WidgetType {
  constructor(
    private suggestion: Suggestion,
    private onAccept: () => void,
    private onReject: () => void
  ) {
    super();
  }

  toDOM() {
    const container = document.createElement('div');
    container.className = 'note-assistant-annotation';
    
    const content = container.createDiv({ cls: 'annotation-content' });
    content.setText(this.suggestion.content);
    
    const actions = container.createDiv({ cls: 'annotation-actions' });
    
    const acceptBtn = actions.createEl('button', { text: 'Accept' });
    acceptBtn.onclick = this.onAccept;
    
    const rejectBtn = actions.createEl('button', { text: 'Reject' });
    rejectBtn.onclick = this.onReject;
    
    return container;
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/unit/chunking.test.ts
import { test, expect } from "bun:test";
import { chunkNote } from "../../src/utils/chunking";

test("chunkNote splits on headings", () => {
  const content = "# Heading 1\nContent...\n# Heading 2\nMore...";
  const chunks = chunkNote(content, 5000);
  expect(chunks.length).toBeGreaterThan(0);
});
```

### Integration Tests

```typescript
// tests/integration/opencode-client.test.ts
import { test, expect } from "bun:test";
import { OpenCodeClient } from "../../src/services/opencode-client";

test("OpenCodeClient session workflow", async () => {
  const client = new OpenCodeClient("http://localhost:8000");

  // Create session
  const sessionId = await client.createSession();
  expect(sessionId).toBeDefined();

  // Send message
  const prompt = "Summarize the following note:\n\nTest content";
  const response = await client.sendMessage(sessionId, prompt);
  expect(response).toBeDefined();
  expect(typeof response).toBe("string");

  // Delete session
  await client.deleteSession(sessionId);
});
```

---

## Development Workflow

### 1. Start Development

```bash
# Terminal 1: Start OpenCode service
cd /path/to/opencode
./start-service.sh

# Terminal 2: Build plugin
cd /path/to/note-buddy
bun run build --watch

# Terminal 3: Run tests
bun test --watch
```

### 2. Test in Obsidian

1. Copy built files to Obsidian plugins folder:
   ```bash
   cp -r dist/* ~/.obsidian/plugins/note-assistant/
   ```

2. Reload Obsidian (Ctrl+R / Cmd+R)

3. Enable plugin in Settings → Community Plugins

4. Configure OpenCode endpoint in plugin settings

---

## Common Pitfalls

### 1. OpenCode Service Not Running
**Symptom**: "Connection refused" errors
**Solution**: Verify OpenCode service is running at configured endpoint

### 2. CodeMirror Decorations Not Showing
**Symptom**: Annotations don't appear in editor
**Solution**: Ensure decorations are added to correct EditorView instance

### 3. Queue Not Processing
**Symptom**: Operations stuck in queue
**Solution**: Check for unhandled promise rejections in processQueue()

---

## Next Steps

After completing quickstart implementation:

1. Review [data-model.md](./data-model.md) for complete entity definitions
2. Review [contracts/opencode-api.md](./contracts/opencode-api.md) for API details
3. Implement remaining operations (extract tasks, improve structure, suggest links)
4. Add comprehensive error handling
5. Implement settings UI with connection testing
6. Write integration tests for all operations
7. Manual testing in Obsidian with real notes

---

**Quickstart Complete** - Ready for implementation.
