# Quickstart: Standard Chat Page

**Feature**: 005-chat-page
**Date**: 2026-02-06

## Overview

This quickstart guide helps developers understand and work with the chat page feature implementation.

## Prerequisites

- Obsidian plugin development environment set up
- OpenCode server running at `http://127.0.0.1:4096`
- Completed features: 002-ai-service, 003-opencode-provider-config

## Architecture Overview

```
┌─────────────┐
│   Plugin    │
│   (main.ts) │
└──────┬──────┘
       │
       ├─────► ChatView (UI)
       │       ├─► SessionList
       │       ├─► MessageList
       │       └─► InputArea
       │
       ├─────► Service layer (session/message logic)
       │       ├─► Session Management
       │       ├─► Message Handling
       │       └─► Usage Tracking
       │
       └─────► OpenCodeClient (API)
               └─► HTTP Communication
```

## Key Components

### Service layer (session/message logic)

Central logic for sessions and messages, implemented in `src/service.ts` (extending OpenCodeClient).

**Location**: `src/service.ts`

**Key Methods**:
- `createSession()` - Create new chat session
- `sendMessage(sessionId, content, { signal })` - Send message and stream response; aborts on `signal` (e.g. session switch), no partial reply stored
- `switchSession(sessionId)` - Change active session; cancels any in-flight send for the previous session
- `deleteSession(sessionId)` - Remove session permanently
- `validateMessageContent(sessionId, content)` - Pre-send validation (empty, token budget)

**Usage Example**:
```typescript
// Service layer in src/service.ts (plugin reference for saveData)
const session = await createSession(plugin);
const result = await sendMessage(session.id, "Hello!", { signal }, plugin);
```

### ChatView

Main UI component for the chat interface.

**Location**: `src/chat-view.ts`

**Key Methods**:
- `render()` - Render complete chat UI
- `renderSessionList()` - Display session sidebar
- `renderMessages()` - Display message history
- `handleSend()` - Handle user message submission

**Usage Example**:
```typescript
const view = new ChatView(containerEl, plugin);
await view.render();
```

## Data Flow

### Sending a Message

```
User Input → validateMessageContent() → sendMessage(sessionId, content, { signal })
    (empty + token budget)                              ↓
                    OpenCodeClient (streaming); UI shows "Sending…" / spinner, send disabled
                              ↓
                    OpenCode API stream (content + usage)
                              ↓
                    Update Session + Messages on completion (or AbortError on session switch)
                              ↓
                    Save to Plugin Data
                              ↓
                    Re-render UI
```

If the user switches session while a reply is streaming, the in-flight request is aborted via `signal`; no partial reply is stored; the previous session's history is unchanged.

### Session Switching

```
User Clicks Session → switchSession(id)
                              ↓
                    Load Session from Plugin Data
                              ↓
                    Update Active Session
                              ↓
                    Re-render Messages
```

## Testing

### Unit Tests

**Location**: `tests/unit/service.test.ts` (or `tests/unit/chat-service.test.ts` for chat-specific tests)

**Key Test Cases**:
- Session creation with default values
- Message sending and response handling
- Session switching and state management
- Usage aggregation calculations
- Error handling for invalid inputs

**Run Tests**:
```bash
bun test tests/unit/service.test.ts
```

### Integration Tests

**Location**: `tests/integration/chat-flow.test.ts`

**Key Test Cases**:
- Complete chat flow (create session, send message, receive response)
- Session persistence across plugin reload
- Model switching mid-conversation
- Error recovery and retry

**Run Tests**:
```bash
bun test tests/integration/chat-flow.test.ts
```

## Common Tasks

### Adding a New Session Action

1. Add method to service layer in `src/service.ts`
2. Update `ChatView` in `src/chat-view.ts` to call the method
3. Add UI button/menu item
4. Write unit tests
5. Update contracts documentation

### Customizing Message Rendering

1. Modify `renderMessage()` in `src/chat-view.ts`
2. Update CSS in `src/styles.css`
3. Test with various message types
4. Ensure markdown rendering works

### Debugging Tips

**Enable Debug Logging**:
```typescript
// In src/service.ts
console.log('Session state:', session);
console.log('Message sent:', message);
```

**Check Plugin Data**:
```bash
# View persisted data
cat .obsidian/plugins/note-buddy/data.json | jq .sessions
```

**Common Issues**:
- Session not persisting: Check `plugin.saveData()` calls
- Messages not rendering: Verify markdown rendering logic
- Usage not updating: Check API response structure

