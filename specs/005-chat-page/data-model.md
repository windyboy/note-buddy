# Data Model: Standard Chat Page

**Feature**: 005-chat-page
**Date**: 2026-02-06

## Overview

This document defines the data entities, relationships, and state transitions for the chat page feature.

## Core Entities

### ChatSession

A conversation container with messages, model selection, and usage tracking.

**Fields**:
- `id: string` - Unique identifier (UUID v4)
- `name: string` - User-defined session name (default: "New Chat")
- `modelId: string` - Selected model in format "providerId/modelId"
- `messages: ChatMessage[]` - Ordered list of messages
- `usage: SessionUsage` - Aggregated token usage
- `createdAt: number` - Unix timestamp (milliseconds)
- `updatedAt: number` - Unix timestamp (milliseconds)

**Validation Rules**:
- `id` must be unique across all sessions
- `name` can be duplicate (sessions distinguished by `id`)
- `modelId` must match format "providerId/modelId"
- `messages` array ordered chronologically
- `createdAt` <= `updatedAt`

**Relationships**:
- Has many `ChatMessage` (composition, cascade delete)
- References one `Model` via `modelId`

### ChatMessage

A single message in a conversation (user or assistant).

**Fields**:
- `id: string` - Unique identifier (UUID v4)
- `role: 'user' | 'assistant'` - Message sender
- `content: string` - Message text content
- `timestamp: number` - Unix timestamp (milliseconds)
- `usage?: MessageUsage` - Token usage (assistant messages only)

**Validation Rules**:
- `role` must be 'user' or 'assistant'
- `content` cannot be empty or whitespace-only
- `usage` only present when `role === 'assistant'`
- `timestamp` must be valid Unix timestamp

**Relationships**:
- Belongs to one `ChatSession`

### MessageUsage

Token usage for a single assistant message.

**Fields**:
- `inputTokens?: number` - Tokens in user prompt
- `outputTokens?: number` - Tokens in assistant response
- `totalTokens?: number` - Total tokens used

**Validation Rules**:
- All fields optional (may be missing from API response)
- When present, values must be non-negative integers
- `totalTokens` should equal `inputTokens + outputTokens` when all present

### SessionUsage

Aggregated token usage across all messages in a session.

**Fields**:
- `totalInputTokens: number` - Sum of all input tokens (default: 0)
- `totalOutputTokens: number` - Sum of all output tokens (default: 0)
- `totalTokens: number` - Sum of all tokens (default: 0)

**Validation Rules**:
- All fields must be non-negative integers
- Updated after each assistant message
- Gracefully handles missing usage data (treats as 0)

## State Transitions

### Session Lifecycle

```
[Created] → [Active] → [Deleted]
    ↓          ↓
    └─────[Inactive]
```

**States**:
- **Created**: New session with empty message history
- **Active**: Currently selected session in UI
- **Inactive**: Exists but not currently selected
- **Deleted**: Permanently removed (no recovery)

**Transitions**:
- Create → Active: User creates new session
- Active → Inactive: User switches to different session
- Inactive → Active: User selects session from list
- Any → Deleted: User deletes session (hard delete)

### Message Lifecycle

```
[Composing] → [Sending/Streaming] → [Sent] → [Persisted]
                  ↓        ↓
              [Failed]  [Cancelled]
                  ↓
              [Retry] → [Sending/Streaming]
```

**States**:
- **Composing**: User typing in input field
- **Sending/Streaming**: Message submitted; reply stream in progress; UI shows loading state; send disabled
- **Sent**: Reply stream completed; message and assistant reply delivered
- **Failed**: API error or timeout occurred
- **Cancelled**: User switched session (or equivalent) during stream; in-flight request aborted; no partial reply stored; session history unchanged
- **Persisted**: Message and reply saved to local storage

**Transitions**:
- Composing → Sending/Streaming: User clicks send (validation passed)
- Sending/Streaming → Sent: Stream completes successfully
- Sending/Streaming → Failed: API error or timeout
- Sending/Streaming → Cancelled: Session switch (or abort); do not store partial reply
- Failed → Retry: User clicks retry button
- Sent → Persisted: Auto-save after response

## Persistence Model

### Storage Structure

```typescript
interface PluginData {
  serviceUrl: string;
  defaultModelId?: string;
  /** User-configured max input or total tokens; used to validate message size before send. */
  tokenBudget?: number;
  sessions: ChatSession[];
  activeSessionId?: string;
}
```

**Storage Location**: Obsidian plugin data directory (`.obsidian/plugins/note-buddy/data.json`)

**Save Triggers**:
- After each message sent/received
- After session create/rename/delete
- After model selection change
- On plugin unload

**Load Triggers**:
- On plugin load
- After app restart

### Data Integrity Rules

**Session Constraints**:
- At least one session must exist at all times
- If active session deleted, select another or create new empty session
- Session IDs must be unique (enforced by UUID v4)
- Session names can be duplicate

**Message Constraints**:
- Messages ordered chronologically within session
- User and assistant messages alternate (user always initiates)
- Empty or whitespace-only messages rejected before persistence

**Usage Constraints**:
- Missing usage fields displayed as "N/A" in UI
- Session totals calculated from available message usage data
- Zero values used for missing fields in aggregation

**Token Budget (settings)**:
- Optional numeric setting (e.g. max input or total tokens); used to validate message size before send
- When set, messages exceeding the budget are blocked with corrective guidance; no API call made
- Estimation heuristic (e.g. 4 chars ≈ 1 token) used when backend estimate not available

## Entity Relationships Diagram

```
┌─────────────────┐
│   PluginData    │
├─────────────────┤
│ sessions[]      │───┐
│ activeSessionId │   │
└─────────────────┘   │
                      │ 1:N
                      ▼
              ┌──────────────┐
              │ ChatSession  │
              ├──────────────┤
              │ id           │
              │ name         │
              │ modelId      │───────► Model (reference)
              │ messages[]   │───┐
              │ usage        │   │
              │ createdAt    │   │
              │ updatedAt    │   │
              └──────────────┘   │ 1:N
                                 ▼
                         ┌──────────────┐
                         │ ChatMessage  │
                         ├──────────────┤
                         │ id           │
                         │ role         │
                         │ content      │
                         │ timestamp    │
                         │ usage?       │
                         └──────────────┘
```

## Migration Strategy

**Initial Release (v1.0.0)**:
- No migration needed (new feature)
- Empty sessions array on first load
- Create default session automatically

**Future Versions**:
- Add version field to PluginData
- Implement migration functions for schema changes
- Preserve backward compatibility for one major version

