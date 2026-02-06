# Chat API Contracts

**Feature**: 005-chat-page
**Date**: 2026-02-06

## Overview

This document defines the internal API contracts between the chat UI components and the OpenCode service layer. These are TypeScript interfaces, not REST endpoints.

## Session Management

### createSession()

Creates a new chat session.

**Input**: None (uses default model from settings)

**Output**:
```typescript
{
  id: string;           // UUID v4
  name: string;         // "New Chat"
  modelId: string;      // "providerId/modelId"
  messages: [];         // Empty array
  usage: {
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTokens: 0
  };
  createdAt: number;    // Unix timestamp
  updatedAt: number;    // Unix timestamp
}
```

**Errors**: None (always succeeds)

### switchSession(sessionId: string)

Switches to a different session. If a reply is currently streaming for the previously active session, the in-flight request MUST be cancelled (e.g. via the same AbortSignal passed to sendMessage); no partial reply is stored for the previous session.

**Input**:
```typescript
{
  sessionId: string;  // Must exist in sessions array
}
```

**Output**:
```typescript
{
  session: ChatSession;  // Full session object with messages
}
```

**Errors**:
- `SessionNotFoundError` - Session ID doesn't exist

**Side Effects**:
- Any in-flight send for the previous active session is aborted; that session's history is unchanged.

### renameSession(sessionId: string, newName: string)

Renames an existing session.

**Input**:
```typescript
{
  sessionId: string;
  newName: string;  // Can be duplicate
}
```

**Output**:
```typescript
{
  session: ChatSession;  // Updated session
}
```

**Errors**:
- `SessionNotFoundError` - Session ID doesn't exist
- `ValidationError` - Empty or whitespace-only name

### deleteSession(sessionId: string)

Deletes a session permanently.

**Input**:
```typescript
{
  sessionId: string;
}
```

**Output**:
```typescript
{
  newActiveSessionId: string;  // ID of session to switch to
}
```

**Errors**:
- `SessionNotFoundError` - Session ID doesn't exist

**Side Effects**:
- If deleting active session, creates new empty session or selects another existing session

## Message Operations

### sendMessage(sessionId: string, content: string, options?: { signal?: AbortSignal })

Sends a user message and streams the assistant response. Content and usage are rendered progressively; final usage may appear when the stream ends. If `signal` is aborted (e.g. user switches session), the in-flight request is cancelled, no partial reply is stored, and the session history is unchanged.

**Input**:
```typescript
{
  sessionId: string;
  content: string;  // Trimmed, non-empty; must pass token budget check when configured
  options?: {
    signal?: AbortSignal;  // When aborted, cancel request and do not store partial reply
  };
}
```

**Output** (streaming): Caller receives progressive updates (content and usage as provided by the backend); on completion:
```typescript
{
  userMessage: ChatMessage;
  assistantMessage: ChatMessage;
  updatedUsage: SessionUsage;
}
```

**Errors**:
- `SessionNotFoundError` - Session ID doesn't exist
- `ValidationError` - Empty or whitespace-only content, or content exceeds user-configured token budget
- `ModelUnavailableError` - Selected model not available
- `ApiError` - OpenCode API error
- `TimeoutError` - Request timeout (60s)
- `AbortError` - Request was aborted (e.g. session switch); no partial reply stored

**Behavior on abort**: When `signal` is aborted, the implementation MUST cancel the in-flight request, MUST NOT append any assistant message to the session, and MUST NOT update session usage for that send. The session that was sending remains unchanged.

### changeModel(sessionId: string, modelId: string)

Changes the model for a session.

**Input**:
```typescript
{
  sessionId: string;
  modelId: string;  // Format: "providerId/modelId"
}
```

**Output**:
```typescript
{
  session: ChatSession;  // Updated session
}
```

**Errors**:
- `SessionNotFoundError` - Session ID doesn't exist
- `ModelNotFoundError` - Model ID invalid or unavailable

## Query Operations

### getSessions()

Retrieves all sessions.

**Input**: None

**Output**:
```typescript
{
  sessions: ChatSession[];  // Ordered by updatedAt desc
  activeSessionId: string;
}
```

**Errors**: None (returns empty array if no sessions)

### getSession(sessionId: string)

Retrieves a specific session with full message history.

**Input**:
```typescript
{
  sessionId: string;
}
```

**Output**:
```typescript
{
  session: ChatSession;  // Full session with messages
}
```

**Errors**:
- `SessionNotFoundError` - Session ID doesn't exist

## Error Types

### SessionNotFoundError

```typescript
{
  code: 'SESSION_NOT_FOUND';
  message: string;
  sessionId: string;
}
```

### ValidationError

```typescript
{
  code: 'VALIDATION_ERROR';
  message: string;
  field: string;
}
```

### ModelUnavailableError

```typescript
{
  code: 'MODEL_UNAVAILABLE';
  message: string;
  modelId: string;
}
```

### ModelNotFoundError

```typescript
{
  code: 'MODEL_NOT_FOUND';
  message: string;
  modelId: string;
}
```

### ApiError

```typescript
{
  code: 'API_ERROR';
  message: string;
  statusCode?: number;
  details?: unknown;
}
```

### TimeoutError

```typescript
{
  code: 'TIMEOUT';
  message: string;
  timeoutMs: number;
}
```

### AbortError

```typescript
{
  code: 'ABORT_ERR';
  message: string;  // e.g. "Request aborted (session switch)"
}
```

## Validation (pre-send)

### validateMessageContent(sessionId: string, content: string)

Validates content before send. Used to enforce empty/whitespace check and user-configured token budget.

**Input**:
```typescript
{
  sessionId: string;
  content: string;  // Raw input before trim
}
```

**Output**:
```typescript
{
  valid: boolean;
  error?: string;  // Validation message when valid is false
}
```

**Rules**:
- Trimmed content must be non-empty (else ValidationError / "Empty or whitespace-only message").
- If plugin settings include a token budget (e.g. maxInputTokens or maxTotalTokens), estimated tokens for the message must not exceed it (else ValidationError / corrective guidance to shorten or increase limit).
- Token estimation may use a heuristic (e.g. 4 chars ≈ 1 token) when backend estimate is not available.
