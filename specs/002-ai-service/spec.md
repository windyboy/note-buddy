# Feature Specification: OpenCode Serve Client Layer

**Feature Branch**: `002-ai-service`  
**Created**: 2026-01-26  
**Status**: Draft → Refined → Clarified  
**Input**: User description:
"Connect the Obsidian plugin to a locally running `opencode serve` server. Add a Settings tab for server connection, and implement a small client service that can health-check and send a single message (non-streaming) via the OpenCode Server API using Obsidian `requestUrl`."

Context:
- Existing plugin already has a ChatView and a Send action (from spec 001).
- This spec adds the connection + client layer only. UI rendering of responses remains minimal.

Requirements:
- Settings: Server URL (default `http://127.0.0.1:4096`).
- Client: `OpenCodeClient` service class to call OpenCode server endpoints.
- Network: Must use `requestUrl` (no browser fetch/CORS).
- API Flow: `GET /global/health` (test), `POST /session` (create), `POST /session/:id/message` (send).
- Error Handling: Throw descriptive errors; UI only displays them.

---

## Clarifications

### Session 2026-01-26

- Q: Should session ID be persisted across Obsidian restarts?  
  → A: **No. Session ID is runtime-only and reset on plugin restart.**

- Q: What should be the API request timeout duration?  
  → A: 10 seconds.

- Q: How should concurrent message requests be handled?  
  → A: Reject new requests while one is in-flight (simple in-flight guard).

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Configure OpenCode Server Settings (Priority: P1)

User configures the local OpenCode server connection in Obsidian settings. Values persist and are used by the client.

**Why this priority**: Without settings, the plugin cannot connect to `opencode serve`.

**Independent Test**: Open settings → edit values → save → restart Obsidian → verify values are still present.

**Acceptance Scenarios**:

1. **Given** plugin is enabled, **When** user opens settings, **Then** this field is shown with default:
   - Server URL = `http://127.0.0.1:4096`

2. **Given** user saves settings, **When** user restarts Obsidian, **Then** settings persist and are loaded correctly.

3. **Given** settings are saved, **When** client makes requests, **Then** the configured URL is used.

---

### User Story 2 - Test Connection (Health Check) (Priority: P1)

User can validate connectivity to the local OpenCode server using a “Test Connection” action in settings.

**Why this priority**: Fast diagnosis for “server not running / wrong URL / server error”.

**Independent Test**: Stop/start `opencode serve`, try correct and incorrect URLs, verify messages.

**Acceptance Scenarios**:

1. **Given** `opencode serve` is running and URL is correct, **When** user clicks “Test Connection”, **Then** `GET /global/health` succeeds and a success message is shown.

2. **Given** server is not reachable, **When** user clicks “Test Connection”, **Then** a clear error is shown (e.g., “Cannot connect. Start `opencode serve` and verify URL/port.”).

3. **Given** server is reachable but returns an error, **When** user clicks “Test Connection”, **Then** a clear error is shown.

---

### User Story 3 - Send Message via Session API (Non-Streaming) (Priority: P2)

Plugin sends a single user message to OpenCode server and receives assistant text. Session is created automatically on first use.

**Why this priority**: This is the minimal functional bridge between Obsidian UI and OpenCode server.

**Independent Test**: Configure settings → send a short message → verify a response is returned or a descriptive error is shown.

**Acceptance Scenarios**:

1. **Given** server is healthy and settings are valid, **When** user sends a message, **Then**:
   - client creates a session if none exists
   - client posts message to `/session/:id/message`
   - client returns assistant text within 10 seconds

2. **Given** server is unreachable, **When** user sends a message, **Then** a connection error is shown.

3. **Given** server returns a non-2xx response, **When** user sends a message, **Then** a descriptive error is shown.

---

### Edge Cases

- Server URL is empty/whitespace/malformed (missing scheme).
- Requests time out (target ≤ 10s) and fail with clear messaging.
- Multiple rapid sends are blocked while one request is in-flight.
- Never log or expose sensitive data in console logs or error details.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Plugin provides a Settings tab with field: Server URL.
- **FR-002**: Default value:
  - Server URL = `http://127.0.0.1:4096`
- **FR-003**: Settings persist across application restarts.
- **FR-004**: All HTTP calls use Obsidian `requestUrl`.
- **FR-005**: Implement `OpenCodeClient` (or `OpenCodeService`) class for server communication.
- **FR-006**: Health check uses `GET /global/health`.
- **FR-007**: Session flow:
  - create session via `POST /session` when needed
  - send message via `POST /session/:id/message`
- **FR-008**: Error handling:
  - Missing/invalid config → descriptive error
  - Network failure/timeout → descriptive error
  - Non-2xx response → descriptive error (no secrets)
- **FR-009**: Request timeout = 10 seconds

### Key Entities *(include if feature involves data)*

- **Plugin Settings**:
  - `serverUrl: string`

- **OpenCodeClient**:
  - `healthCheck(): Promise<void>`
  - `ensureSession(): Promise<string>`
  - `sendMessage(input: string): Promise<string>`

- **Session**:
  - Runtime-only `sessionId` (not persisted)

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: User can configure server settings in under 30 seconds.
- **SC-002**: “Test Connection” reliably indicates success vs unreachable vs server error.
- **SC-003**: With valid server and config, a message returns assistant text within 10 seconds (non-streaming).
- **SC-004**: Sensitive data is never logged or exposed in error messages.
- **SC-005**: Settings persist across restarts.

### Success Indicators

- Minimal friction to connect to local `opencode serve`.
- Failures are diagnosable without reading source code.
- Feature stops at “single session + single-turn request” without scope creep.

---
