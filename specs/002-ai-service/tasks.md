# Implementation Plan: OpenCode Serve Client Integration

**Branch**: `002-ai-service`  
**Spec**: `specs/002-ai-service/spec.md`

## Goal

Extend the existing Note Buddy plugin with a minimal client layer that can:
1. Configure connection to a local `opencode serve`
2. Validate connectivity via health check
3. Send a single non-streaming message via session API

This plan intentionally stops at a **single-session, single-turn client**.

---

## Scope Boundaries (Explicit Stop Conditions)

This plan does NOT include:
- Streaming responses
- Message or conversation persistence
- Multiple concurrent sessions
- Provider / model abstraction
- Advanced retry, backoff, or queueing

Any of the above requires a new spec.

---

## Implementation Phases

### Phase 1 — Settings Integration

**Objective**: Allow user to configure local OpenCode server connection.

**Parallel Opportunities**: Steps 1-3 can run concurrently (independent file changes)

Steps:
1. [X] Define `ServiceSettings` interface and default values in `src/models.ts`
2. [X] Load / save settings using Obsidian plugin APIs in `src/main.ts`
3. [X] Implement Settings tab UI in `src/settings.ts`:
   - Server URL input field with validation

**Done when**:
- Settings persist across restart
- URL validation prevents invalid entries

---

### Phase 2 — OpenCode Client Service

**Objective**: Implement a minimal HTTP client for OpenCode server.

**Parallel Opportunities**: Steps 1-2 can run concurrently (client class and models)

Steps:
1. [X] Create `OpenCodeClient` class in `src/service.ts`
2. [X] Implement `healthCheck()` using `GET /global/health` in `src/service.ts`
3. [X] Implement internal request helper in `src/service.ts`:
   - Uses `requestUrl`
   - Applies 10s timeout
4. [X] Implement session creation via `POST /session` in `src/service.ts`

**Done when**:
- Health check clearly reports success / failure
- Session ID is created and stored in memory only

---

### Phase 3 — Message Send Integration

**Objective**: Send a user message via existing ChatView send action.

Steps:
1. [X] Add in-flight request guard (`isSending`) in `src/views/ChatView.ts`
2. [X] Implement `sendMessage(input: string)` in `src/service.ts`
3. [X] On first send, ensure session exists in `src/service.ts`
4. [X] Send message via `POST /session/:id/message` in `src/service.ts`
5. [X] Return assistant text or throw descriptive error in `src/service.ts`

**Done when**:
- Only one request can be in flight
- All failure paths produce actionable errors
- UI can display success or error without internal knowledge

---

## Manual Validation Checklist

- Settings save/load correctly
- Health check succeeds when server is running
- Health check fails clearly when server is down
- Message send works within 10 seconds

---

## Exit Criteria

Stop implementation when:
- A single message can be sent and responded to successfully
- Errors are diagnosable without reading source code

Further enhancements require a new feature specification.
