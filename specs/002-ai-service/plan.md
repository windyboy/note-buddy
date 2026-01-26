# Implementation Plan: AI Service Integration

**Branch**: `002-ai-service` | **Date**: 2026-01-26 | **Spec**: specs/002-ai-service/spec.md

## Summary

Add a local opencode service integration to Note Buddy. Provide a settings panel for service URL, a health check using `GET /global/health`, session creation via `POST /session`, and message sending via `POST /session/{sessionID}/message`. No authentication is required.

## Scope and Stop Conditions

**In scope**:
- Service URL setting only
- Health check with user-facing success/error feedback
- Session creation on first message send
- Message send using `parts` array and render assistant response text
- Manual testing per quickstart scenarios

**Out of scope (stop here)**:
- Authentication UI
- Streaming responses
- Session browser/history UI
- Message persistence or storage
- Model selection UI

## Execution Order (Phased)

### Phase 1: Settings (US1)

Steps:
1. Define `ServiceSettings` with `serviceUrl` only in `src/models.ts`.
2. Load/save settings in `src/main.ts` (plugin lifecycle).
3. Build settings tab in `src/settings.ts` with Service URL input and validation.

Stop condition:
- Service URL persists across restart and rejects empty/malformed input.

### Phase 2: Connection Test (US2)

Steps:
1. Add `OpenCodeClient.healthCheck()` in `src/service.ts` calling `/global/health`.
2. Add `ConnectionState` + `ConnectionStatus` in `src/models.ts`.
3. Add "Test Connection" button in settings to call health check and show Notice.

Stop condition:
- Success/failure feedback matches service state within 10 seconds.

### Phase 3: Send Message (US3)

Steps:
1. Add `SessionState` in `src/models.ts`; track runtime `sessionID` in `src/main.ts`.
2. Implement `OpenCodeClient.createSession()` and `sendMessage()` in `src/service.ts`.
3. On first send or 404, create session and retry once.
4. Update `src/views/ChatView.ts` send handler to send `parts` and render response text.

Stop condition:
- Messages send successfully, responses render, session reused across sends.

## File Ownership

```text
src/
├── main.ts              # Plugin lifecycle, settings load/save, session state
├── settings.ts          # Settings UI (service URL, test connection)
├── service.ts           # OpenCodeClient (health, session, message)
├── models.ts            # Settings, connection, session, message types
└── views/ChatView.ts    # Send handler uses OpenCodeClient
```

## Testing

Manual testing only. Follow `specs/002-ai-service/quickstart.md` for all scenarios.
