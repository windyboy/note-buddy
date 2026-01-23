# Phase 0: Research - Note Assistant Plugin

**Date**: 2026-01-23
**Purpose**: Resolve technical unknowns and document technology choices

## Research Questions

### Q1: Obsidian Plugin API - Command Registration & Editor Access
**Question**: How to register command palette commands and access the active editor?

**Answer**: Obsidian Plugin API provides:
- `this.addCommand()` for command palette registration
- `this.app.workspace.getActiveViewOfType(MarkdownView)` for editor access
- `editor.getValue()` and `editor.setValue()` for content manipulation
- `editor.getSelection()` for selected text

**Decision**: Use standard Obsidian Plugin API patterns. Commands registered in `onload()`, editor accessed via workspace API.

**References**: Obsidian Plugin API documentation, existing plugin examples

---

### Q2: Inline Annotations Implementation
**Question**: How to render inline annotations with accept/reject/edit controls in Obsidian editor?

**Answer**: Two approaches:
1. **EditorSuggest API**: For autocomplete-style suggestions (not suitable - no persistent UI)
2. **Custom decorations with CodeMirror 6**: Direct manipulation of editor decorations

**Decision**: Use CodeMirror 6 decorations with custom widgets. Create decoration widgets that render:
- Proposed change preview
- Accept/Reject/Edit buttons
- Positioned at target line/offset

**Implementation Notes**:
- Use `EditorView.decorations` facet
- Create `WidgetType` subclass for annotation UI
- Handle button clicks via event listeners
- Remove decorations on accept/reject

**References**: CodeMirror 6 documentation, Obsidian's editor extensions

---

### Q3: OpenCode API Integration
**Question**: How to integrate with local OpenCode service for AI operations?

**Answer**: OpenCode provides HTTP REST API at configurable endpoint (default: localhost:8000).

**Decision**: Use Bun's built-in `fetch()` for HTTP requests. No external HTTP client needed.

**API Contract** (validated against specs/001-opencode-client/contracts/api.yaml):
- **Session-based API**: Create session → Send messages → Delete session
- **Health check**: `GET /global/health` (returns `{"healthy": true, "version": "1.0.0"}`)
- **Create session**: `POST /session` with title and permissions
- **Send message**: `POST /session/{sessionID}/message` with natural language prompts
- **Delete session**: `DELETE /session/{sessionID}`
- **API Key**: Not used in MVP (will be added in future if needed)

**Implementation Notes**:
```typescript
// OpenCodeClient constructor (no API key for MVP)
constructor(endpoint: string)

// Session workflow
const sessionId = await client.createSession();
const response = await client.sendMessage(sessionId, prompt);
await client.deleteSession(sessionId);
```

**Error Handling**:
- Connection refused → "Cannot connect to OpenCode service. Please check that the service is running."
- Timeout (30s) → "Request timed out. The note may be too large."
- Server error → "OpenCode service error. Please try again later."
- Session creation failure → Display error with manual "Retry" button (no auto-retry)

**References**: `contracts/opencode-api.md`, `contracts/opencode-api-reference.yaml`

---

### Q4: Markdown Parsing & Manipulation
**Question**: How to parse and manipulate markdown while preserving formatting?

**Answer**: Options:
1. **String manipulation**: Simple but error-prone
2. **Markdown AST parser**: Robust but heavy (e.g., remark, unified)
3. **Hybrid approach**: AST for analysis, string ops for simple insertions

**Decision**: Use pure string operations and regex only (no external markdown parsing library):
- Use string operations and regex for structure analysis (headings, lists)
- Use line-based string operations for insertions (summary at top, tasks at end)
- Preserve original formatting by working with line-based operations
- Implement simple parsing for headings (`/^#+\s/`), lists (`/^[\s]*[-*+]\s/`), etc.

**Implementation Notes**:
- Track line numbers for insertion positions
- Use `\n` line separator detection
- Preserve indentation and whitespace
- Handle edge cases: empty lines, frontmatter, code blocks
- No external dependencies needed

**References**: Obsidian's markdown handling, CodeMirror line operations

---

### Q5: Operation Queue Implementation
**Question**: How to implement sequential operation processing (one at a time)?

**Answer**: Queue pattern with async processing:
- Maintain FIFO queue of pending operations
- Process one operation at a time
- Block new operations until current completes

**Decision**: Simple in-memory queue with async/await:
```typescript
class OperationQueue {
  private queue: Operation[] = [];
  private processing = false;

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
      await this.executeOperation(op);
    }
    this.processing = false;
  }
}
```

**Implementation Notes**:
- Show queue position in UI via banner notification at editor top ("Processing... 2 operations ahead")
- Allow cancellation of both queued and in-progress operations using AbortController
- Add cancel button in queue status UI
- Clear queue on plugin unload

**Cancellation Implementation**:
```typescript
interface Operation {
  // ... other fields
  abortController: AbortController;
}

class OperationQueue {
  cancel(operationId: string) {
    const op = this.queue.find(o => o.id === operationId);
    if (op) {
      op.abortController.abort();
      this.queue = this.queue.filter(o => o.id !== operationId);
    }
  }
}
```

**References**: Standard async queue patterns

---

### Q6: Vault-Wide Link Search
**Question**: How to search entire vault for related notes when suggesting links?

**Answer**: Use Obsidian's vault API to access all markdown files.

**Decision**: Use `app.vault.getMarkdownFiles()` to retrieve all notes:
```typescript
async function getVaultNotes(): Promise<VaultNote[]> {
  const files = this.app.vault.getMarkdownFiles();
  return files.map(file => ({
    path: file.path,
    basename: file.basename,
    // Optionally include content for better matching
  }));
}
```

**Implementation Notes**:
- Send note titles/paths to OpenCode (not full content for performance)
- OpenCode returns matching note paths with relevance scores
- Plugin resolves paths to create wiki-links: `[[note-title]]`
- Cache vault index for performance with event-driven updates:
  ```typescript
  // Listen to vault events in plugin onload()
  this.registerEvent(this.app.vault.on('create', (file) => {
    if (file instanceof TFile && file.extension === 'md') {
      this.vaultCache.add(file);
    }
  }));

  this.registerEvent(this.app.vault.on('delete', (file) => {
    this.vaultCache.remove(file.path);
  }));

  this.registerEvent(this.app.vault.on('rename', (file, oldPath) => {
    this.vaultCache.update(oldPath, file);
  }));
  ```

**References**: Obsidian Vault API documentation

---

### Q7: Plugin Settings & Configuration
**Question**: How to store and manage plugin settings (OpenCode endpoint URL)?

**Answer**: Use Obsidian's settings API with settings tab.

**Decision**: Standard Obsidian settings pattern:
```typescript
interface NoteAssistantSettings {
  opencodeEndpoint: string;
  timeout: number;
}

const DEFAULT_SETTINGS: NoteAssistantSettings = {
  opencodeEndpoint: 'http://localhost:8000',
  timeout: 30000
};

class NoteAssistantPlugin extends Plugin {
  settings: NoteAssistantSettings;

  async onload() {
    await this.loadSettings();
    this.addSettingTab(new NoteAssistantSettingTab(this.app, this));
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    await this.saveData(this.settings);
  }
}
```

**Implementation Notes**:
- Settings tab with text input for endpoint URL
- Validate URL format on save
- Test connection button to verify OpenCode availability

**References**: Obsidian Plugin API - Settings

---

### Q8: Testing Strategy
**Question**: How to test Obsidian plugin with Bun test framework?

**Answer**: Three-tier testing approach:

**Decision**:
1. **Unit tests**: Test individual functions (markdown parsing, queue logic)
2. **Integration tests**: Mock OpenCode API, test command handlers
3. **Manual tests**: Test in actual Obsidian environment

**Implementation Notes**:
```typescript
// Unit test example
import { test, expect } from "bun:test";
import { parseHeadings } from "../src/utils/markdown";

test("parseHeadings extracts headings", () => {
  const content = "# Heading 1\nContent...\n## Heading 2\nMore...";
  const headings = parseHeadings(content);
  expect(headings.length).toBe(2);
});

// Integration test with mock
test("summarize command calls OpenCode", async () => {
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ suggestions: [...] })
  });
  global.fetch = mockFetch;

  await summarizeCommand(editor, settings);
  expect(mockFetch).toHaveBeenCalledWith(...);
});
```

**References**: Bun test documentation, Obsidian plugin testing patterns

---

## UI/UX Implementation Details

### Edit Button Behavior
**Decision**: Inline editing with text input/textarea

When user clicks Edit button on an annotation:
1. Replace suggestion content with inline text input (for short text) or textarea (for multi-line)
2. User can modify the suggestion content directly
3. Show Accept/Cancel buttons (replacing original Accept/Reject/Edit buttons)
4. Accept applies the edited content to the note
5. Cancel reverts to original suggestion with original buttons

### Queue Status Display
**Decision**: Banner notification at editor top

- Display banner at top of editor (non-intrusive, above content)
- Show message format: "Processing... 2 operations ahead"
- Include cancel button for current operation
- Banner auto-dismisses when queue is empty
- Update banner in real-time as queue changes

### Loading Indicators
**Decision**: Semi-transparent editor overlay

- Show overlay covering editor during processing
- Display spinner animation with operation name
- Prevent user interaction with editor while loading
- Semi-transparent background (e.g., rgba(0,0,0,0.1))
- Remove overlay when operation completes or fails

### Multiple Suggestions Display
**Decision**: Sequential one-at-a-time display

- Show one suggestion at a time to avoid UI clutter
- After Accept/Reject, automatically show next suggestion
- Display progress indicator: "Suggestion 2 of 5"
- Add next/previous navigation buttons to annotation widget
- Track current suggestion index in preview state
- User can skip forward or review previous suggestions

---

## Error Handling Strategies

### Session Creation Failure
**Decision**: Manual retry with user control

- Display error immediately: "Cannot connect to OpenCode service. Please check that the service is running."
- Show "Retry" button to user
- Do NOT auto-retry (prevents infinite loops)
- Mark operation status as FAILED
- Clear error state on successful retry

### Concurrent Operations
**Decision**: Queue-based sequential processing (confirmed)

- Add new operation to queue when one is in progress
- Wait for current operation to complete
- Process operations sequentially in FIFO order
- Show queue position in banner notification
- No parallel processing to avoid conflicts

### Empty Response Handling
**Decision**: Friendly operation-specific messages

When OpenCode returns empty suggestions list:
- Mark operation as COMPLETED (not FAILED)
- Display operation-specific friendly messages:
  - Summarize: "Note is too short to summarize"
  - Extract tasks: "No tasks found in this note"
  - Improve structure: "Note structure looks good"
  - Suggest links: "No related notes found"
- Distinguish between empty results (expected) and errors (unexpected)

---

## Technology Stack Summary

### Core Technologies
- **Runtime**: Bun (built-in APIs for HTTP, testing)
- **Language**: TypeScript (strict mode)
- **Platform**: Obsidian Plugin API (Electron-based)
- **Editor**: CodeMirror 6 (for decorations/annotations)

### Key Libraries
- **Obsidian Plugin API**: Command registration, editor access, vault operations, settings
- **Bun fetch**: HTTP client for OpenCode API
- **Bun test**: Testing framework
- **CodeMirror 6**: Editor decorations and widgets

### Architecture Patterns
- **Command Pattern**: Command palette handlers
- **Queue Pattern**: Sequential operation processing
- **Decorator Pattern**: Inline annotations via CodeMirror decorations

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| OpenCode API changes | Medium | High | Define clear contract in Phase 1, version API |
| CodeMirror complexity | Medium | Medium | Start with simple decorations, iterate |
| Offline detection | Low | Low | Simple connection check before operations |

## Phase 1 Clarifications (Resolved)

### 1. OpenCode API Contract ✅

**Decision**: Use session-based OpenCode API (validated against specs/001-opencode-client/contracts/api.yaml)

**Implementation**:
- Create session: `POST /session`
- Send message: `POST /session/{sessionID}/message`
- Delete session: `DELETE /session/{sessionID}`
- Use natural language prompts for each operation
- Parse text responses from `parts` array

**Reference**: See `contracts/opencode-api.md` for complete contract

---

### 2. Annotation UI Design ✅

**Decision**: Light background highlight with inline controls

**Visual Design**:
- Background: Light yellow (#FFF9E6) or light blue (#E6F3FF)
- Border: 1px solid with matching color (yellow: #FFE066, blue: #66B3FF)
- Padding: 8px
- Buttons: Small, inline, with clear labels (Accept/Reject/Edit)
- Position: Directly at suggestion location in editor

---

### 3. Error Message Copy ✅

**Decision**: User-friendly messages without technical details

**Error Messages**:
- Connection refused: "Cannot connect to OpenCode service. Please check that the service is running."
- Timeout: "Request timed out. The note may be too large."
- Server error: "OpenCode service error. Please try again later."

**Principle**: Simple, actionable, no HTTP status codes or stack traces

---

### 4. Settings Validation ✅

**Decision**: Relaxed URL validation

**Validation Rules**:
- Check basic URL format (http:// or https://)
- Allow any hostname (localhost, 127.0.0.1, or remote)
- Allow any port number
- No connection testing during validation
- User can test connection manually via "Test Connection" button

---

**Phase 0 & Phase 1 Complete** - All technical unknowns resolved and clarified.
