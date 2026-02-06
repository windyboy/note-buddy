# Research: Standard Chat Page

**Feature**: 005-chat-page
**Date**: 2026-02-06

## Overview

This document captures technical decisions and research findings for implementing a complete chat page with session management, message rendering, model selection, and token usage tracking.

## Decision 1: Session Persistence Strategy

**Decision**: Use Obsidian's `plugin.saveData()` / `plugin.loadData()` with a structured JSON format storing an array of sessions, each containing messages and metadata.

**Rationale**:
- Obsidian provides built-in persistence API that handles file I/O automatically
- JSON format is simple, debuggable, and supports all required data types
- No external database dependency needed for single-user local storage
- Automatic serialization/deserialization with TypeScript interfaces
- Consistent with existing plugin settings persistence pattern

**Alternatives Considered**:
- **IndexedDB**: Rejected - overkill for single-user local storage, adds complexity
- **Separate JSON files per session**: Rejected - harder to manage atomicity, more file I/O overhead
- **SQLite**: Rejected - requires native dependencies, not standard in Obsidian plugins

**Implementation Notes**:
- Store sessions in `plugin.settings.sessions` array
- Each session contains: `id`, `name`, `modelId`, `messages[]`, `usage`, `createdAt`, `updatedAt`
- Save after each message to prevent data loss
- Use UUID v4 for session IDs to ensure uniqueness

## Decision 2: Token Usage Tracking

**Decision**: Extract usage data from OpenCode API `MessageResponse.usage` field and aggregate at both message and session levels.

**Rationale**:
- OpenCode API already provides usage data in response (input_tokens, output_tokens, total_tokens)
- Session-level aggregation enables cost awareness across conversation
- Per-message tracking enables detailed analysis and debugging
- Graceful degradation when usage data is missing (show "N/A")

**Alternatives Considered**:
- **Client-side token estimation**: Rejected - inaccurate, doesn't match actual billing
- **No tracking**: Rejected - fails FR-004 requirement for usage visibility

**Implementation Notes**:
- Store usage per message: `{ inputTokens?: number, outputTokens?: number, totalTokens?: number }`
- Aggregate session usage by summing all message usage values
- Display "N/A" when usage fields are undefined
- Update session totals after each assistant reply

## Decision 3: Session List UI Pattern

**Decision**: Implement a sidebar list with session names, timestamps, and active state indicator, following Obsidian's native file explorer pattern.

**Rationale**:
- Consistent with Obsidian's existing UI patterns (file explorer, tag pane)
- Users are already familiar with sidebar navigation in Obsidian
- Supports quick switching between sessions
- Allows for future enhancements (search, sorting, filtering)

**Alternatives Considered**:
- **Dropdown menu**: Rejected - poor UX for many sessions, no visual context
- **Tab bar**: Rejected - limited space, doesn't scale beyond 5-10 sessions
- **Modal dialog**: Rejected - requires extra click, breaks flow

**Implementation Notes**:
- Display sessions in reverse chronological order (newest first)
- Show session name, last message timestamp, and active indicator
- Support click to switch, right-click for rename/delete
- Highlight active session with Obsidian's `is-active` class

## Decision 4: Message Rendering Approach

**Decision**: Reuse markdown rendering approach from 004-ui-enhancement (manual regex-based rendering) with sender attribution and timestamp display.

**Rationale**:
- Already implemented and tested in previous feature
- Lightweight, no external dependencies
- Supports essential markdown (code blocks, inline code, bold, italic, lists)
- Consistent with existing chat-view.ts implementation

**Alternatives Considered**:
- **Full markdown library (marked.js, markdown-it)**: Rejected - adds significant bundle size
- **Plain text only**: Rejected - poor UX for code snippets and formatting

**Implementation Notes**:
- Extend existing `renderMarkdown()` utility from chat-view.ts
- Add sender label ("You", "Assistant") above each message
- Display timestamp in relative format ("2 minutes ago") with absolute tooltip
- Use Obsidian's CSS variables for consistent theming

## Decision 5: Model Selection Per Session

**Decision**: Store model selection (providerId/modelId) per session and allow changing model mid-conversation.

**Rationale**:
- Different conversations may benefit from different models (speed vs quality)
- Existing model selection infrastructure from 003-opencode-provider-config can be reused
- Per-session storage enables model experimentation without affecting other sessions

**Alternatives Considered**:
- **Global model setting only**: Rejected - less flexible, can't compare models easily
- **Immutable model per session**: Rejected - forces creating new session to try different model

**Implementation Notes**:
- Store `modelId` (format: "providerId/modelId") in session object
- Display current model in session header
- Provide model selector dropdown in chat UI
- When model changes, next message uses new model (no retroactive changes)

## Decision 6: Error Handling Strategy

**Decision**: Display inline error messages with retry capability, preserving conversation context on failure.

**Rationale**:
- Inline errors keep user in conversation flow
- Retry button enables quick recovery from transient failures
- Preserving context prevents data loss on network issues
- Consistent with 004-ui-enhancement error handling pattern

**Alternatives Considered**:
- **Modal error dialogs**: Rejected - disruptive, breaks conversation flow
- **Toast notifications**: Rejected - disappear too quickly, no retry action
- **Silent failure**: Rejected - confusing, violates FR-009

**Implementation Notes**:
- Show error message below failed assistant response
- Include "Retry" button that resends last user message
- Preserve user input on send failure
- Log errors to console for debugging

## Decision 7: Input Validation Strategy

**Decision**: Client-side validation for empty input and token budget limits before sending to API.

**Rationale**:
- Prevents unnecessary API calls for invalid input
- Provides immediate feedback to user
- Reduces server load and potential error states
- Aligns with FR-010 and FR-011 requirements

**Alternatives Considered**:
- **Server-side validation only**: Rejected - slower feedback, wastes network round-trip
- **No validation**: Rejected - violates functional requirements

**Implementation Notes**:
- Trim whitespace before validation
- Block send button when input is empty or exceeds token budget
- Show validation message below input field
- Estimate token count using simple heuristic (4 chars ≈ 1 token)

## Decision 8: Streaming, Loading State, and Cancel-on-Switch

**Decision**: Replies are streamed from the OpenCode API; UI shows progressive content and usage. Show explicit loading state (e.g. "Sending…" or spinner) and disable/mark send in-progress until stream ends. When the user switches session mid-stream, cancel the in-flight request (AbortController), do not store partial reply, leave the previous session's history unchanged.

**Rationale**:
- Matches spec clarifications (streaming in scope, explicit loading, cancel on switch)
- OpenCode message API supports streaming; client already consumes response parts by type
- AbortController is standard for cancelable fetch; avoids orphaned updates and cross-session state
- No partial reply storage keeps session history consistent and simplifies tests

**Alternatives Considered**:
- **Let stream finish in background**: Rejected – spec requires cancel and no partial store
- **Store partial on cancel**: Rejected – spec requires current session unchanged

**Implementation Notes**:
- Pass AbortSignal from ChatView into sendMessage; create new AbortController per send; call abort() on session switch (and optionally on unmount)
- While in flight: show "Sending…" or spinner, disable send button, ignore switch-to-same-session no-op
- On cancel: reject in-flight promise, do not append any assistant message or update usage for that send

## Decision 9: Token Budget Source and Validation

**Decision**: Token budget is user-configurable in plugin settings (e.g. max input tokens or max total tokens). Validate before send; block send and show corrective guidance when message exceeds budget.

**Rationale**:
- Spec clarification: user-configurable in plugin settings
- Aligns with existing settings pattern (service URL, default model)
- Client-side validation avoids unnecessary API calls and gives immediate feedback

**Alternatives Considered**:
- **Backend/model default only**: Rejected – spec requires user-configurable
- **Out of scope**: Rejected – FR-011/AC-008 require enforcement

**Implementation Notes**:
- Add setting e.g. `maxInputTokens` or `maxTotalTokens` (number, optional); validate using same heuristic as empty-check (e.g. 4 chars ≈ 1 token) or backend estimate if available
- Store in plugin settings; persist with existing saveData/loadData
- Show actionable message when over budget (e.g. "Message exceeds token limit; shorten or increase limit in settings")

## Summary

All technical decisions are resolved and ready for Phase 1 design work. Key technologies:
- TypeScript 5.9 + Obsidian API 1.11.4
- Vitest for testing
- JSON-based local persistence
- Manual markdown rendering (from 004-ui-enhancement)
- Per-session model selection (from 003-opencode-provider-config)

