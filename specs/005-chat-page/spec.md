# Feature Specification: Standard Chat Page

**Feature Branch**: `005-chat-page`  
**Created**: 2026-02-06  
**Status**: Draft  
**Input**: User description: "帮我建立一个完整的对话页面，有回复渲染，session管理，模型管理，token使用量等等，标准的对话页面。补充：不需要用户并发，就是当前一个opencode的客户端"

## Clarifications

### Session 2026-02-06

- Q: Should sessions persist across app restarts? → A: Persist locally across restarts.
- Q: What local data protection level is required for persisted chat data? → A: Plain local storage (no encryption).
- Q: If the selected model is unavailable at send time, how should send behave? → A: Block send and require selecting an available model.
- Q: Are duplicate session names allowed? → A: Yes, duplicate names are allowed; sessions are distinguished by unique internal ID.
- Q: What is the session deletion behavior? → A: Hard delete immediately, no undo.
- Q: Are replies streamed or shown only when complete? → A: Streaming in scope; add streaming to spec and AC.
- Q: How should the UI indicate send/reply in progress? → A: Explicit loading state (e.g. "Sending…" or spinner); disable or clearly mark send as in-progress until reply stream ends.
- Q: Should the feature enforce limits on sessions or messages per session? → A: No limit in scope; design for normal usage; limits can be added later if needed.
- Q: Where should the token budget (for blocking oversized messages) come from? → A: User-configurable in plugin settings (e.g. max input or total tokens); validate before send.
- Q: If the user switches session while a reply is streaming, what should happen? → A: Cancel the in-flight stream; do not store partial reply; current session history unchanged.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Conduct a chat session (Priority: P1)

As a user of the OpenCode client, I can start a conversation, send messages, and see assistant replies rendered with clear attribution and timestamps so I can complete a normal chat flow.

**Why this priority**: This is the core value of the chat page and enables immediate usefulness.

**Independent Test**: Can be fully tested by starting a new session, sending a message, and verifying a rendered reply with metadata.

**Acceptance Scenarios**:

1. **Given** a user opens the chat page, **When** they send a message, **Then** the message and the assistant reply are streamed and rendered in order with sender labels and timestamps (content and usage as provided by the stream).
2. **Given** a reply is received, **When** it is displayed, **Then** the UI shows token usage for that reply and the session total.

---

### User Story 2 - Manage sessions (Priority: P2)

As a user, I can create, switch, rename, and delete conversation sessions so I can organize my work and resume the correct context.

**Why this priority**: Session management prevents losing context and is essential for repeated use.

**Independent Test**: Can be fully tested by creating two sessions, switching between them, renaming one, and deleting the other.

**Acceptance Scenarios**:

1. **Given** multiple sessions exist, **When** the user selects a session, **Then** the message history and usage totals for that session are displayed.
2. **Given** the user starts a new session, **When** the session is created, **Then** it appears in the session list and becomes the active session.
3. **Given** an existing session, **When** the user renames it, **Then** the updated name is shown in the session list and header.
4. **Given** the active session is deleted, **When** deletion completes, **Then** the system selects another existing session or creates a new empty session as active.

---

### User Story 3 - Choose model and understand usage (Priority: P3)

As a user, I can select the model for a session and understand token usage so I can balance response quality and cost awareness.

**Why this priority**: Model choice and usage visibility improve control and transparency.

**Independent Test**: Can be fully tested by choosing a different model for a session and verifying usage reporting updates.

**Acceptance Scenarios**:

1. **Given** model options are available, **When** the user changes the model for a session, **Then** new replies use the selected model and the chosen model is shown in the session header.

---

### Edge Cases

- A message exceeds the allowed token budget for a single reply.
- The selected model is unavailable or reply generation fails.
- The user deletes the currently active session.
- The user submits empty or whitespace-only input.
- The user switches to another session while a reply is streaming: cancel the in-flight stream, do not store partial reply, leave current session history unchanged.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST provide a single-user chat page for the current OpenCode client without multi-user concurrency.
- **FR-002**: System MUST allow users to start a new session and send messages within that session.
- **FR-003**: System MUST render assistant replies in chronological order with sender attribution and timestamps. Replies MUST be streamed (content and usage shown as the backend streams; final usage may appear when the stream ends).
- **FR-004**: System MUST display token usage for assistant replies (input, output, total when provided by the backend) and aggregate totals per session.
- **FR-005**: System MUST allow users to view a list of sessions and switch between them.
- **FR-006**: System MUST allow users to rename and delete sessions.
- **FR-007**: System MUST allow users to choose a model for each session and show the current model in the session header.
- **FR-008**: System MUST persist message history and usage totals for each session locally across app restarts until the user deletes the session.
- **FR-009**: System MUST present user-friendly error states for failed or unavailable model responses.
- **FR-017**: System MUST show an explicit loading state (e.g. "Sending…" or spinner) while a message is in flight and MUST disable or clearly mark the send action as in-progress until the reply stream ends.
- **FR-010**: System MUST prevent sending empty or whitespace-only messages and provide clear validation feedback.
- **FR-011**: System MUST prevent sending messages that exceed the user-configured token budget (e.g. max input or total tokens in plugin settings) and provide corrective guidance.
- **FR-012**: System MUST keep session state valid after active-session deletion by selecting another session or creating a new empty session.
- **FR-013**: System MUST persist session and message data in plain local storage without encryption for this feature scope.
- **FR-014**: System MUST block send when the selected model is unavailable and prompt the user to choose an available model before retrying.
- **FR-015**: System MUST assign each session a unique internal identifier and allow duplicate session display names.
- **FR-016**: System MUST hard-delete sessions and their messages immediately on delete action, with no undo or archive behavior.
- **FR-018**: When the user switches to another session while a reply is streaming, the system MUST cancel the in-flight stream, MUST NOT store a partial reply, and MUST leave the current session's history unchanged.

### Acceptance Criteria

- **AC-001**: A single OpenCode client can start a session, send a message, and see a rendered reply without any concurrent user context.
- **AC-002**: Switching sessions shows only the selected session's message history and usage totals.
- **AC-003**: Each displayed message shows sender attribution and timestamp; assistant replies are streamed (progressive content and usage); usage counts are shown when available from the stream, and unavailable fields are shown as `N/A`.
- **AC-004**: Renaming or deleting a session updates the session list and the active session state accordingly.
- **AC-005**: The selected model is visible in the session header and applies to new replies.
- **AC-006**: Failed responses display a clear error state and do not corrupt the session history.
- **AC-013**: While a message is in flight, the UI shows an explicit loading state (e.g. "Sending…" or spinner) and the send action is disabled or clearly in-progress until the reply stream ends.
- **AC-007**: Empty or whitespace-only input cannot be sent and a validation message is shown.
- **AC-008**: Messages exceeding the user-configured token budget (plugin settings) are blocked before send with an actionable prompt to shorten input.
- **AC-009**: After closing and reopening the client, previously existing sessions, histories, selected model, and usage totals are restored from local storage.
- **AC-010**: If the selected model is unavailable at send time, the message is not sent, and the UI requires the user to pick an available model before sending.
- **AC-011**: Creating or renaming a session to a name already used by another session is allowed, and switch/rename/delete actions always apply to the selected session ID.
- **AC-012**: Deleting a session removes it and its messages immediately from local storage and UI with no undo or restore path.
- **AC-014**: Switching session while a reply is streaming cancels the in-flight stream; no partial reply is stored; the session that was sending remains unchanged.

### Key Entities *(include if feature involves data)*

- **Session**: A locally persisted conversation container identified by a unique internal ID, with a name (not required to be unique), selected model, creation time, and usage totals.
- **Message**: A user or assistant entry with content, sender role, timestamp, and token usage.
- **Model Option**: A selectable model with a display name and availability status.
- **Usage Summary**: Aggregated token counts per session and per message.
- **Token budget (settings)**: User-configurable value (e.g. max input or total tokens) used to validate message size before send.

## Assumptions

- The feature targets a single user in a single OpenCode client, with no concurrent multi-user access.
- No enforced cap on number of sessions or messages per session in this scope; design for normal usage; limits may be added in a later iteration if needed.
- Authentication and cross-device synchronization are out of scope unless specified later.
- Usage metrics are limited to token counts and do not include billing or cost calculations.
- Local persistence security for this feature is plain storage only; encryption at rest is out of scope.

## Out of Scope

- Multi-user accounts, collaboration, or concurrent session access.
- Billing, pricing, or cost estimation based on token usage.
- Administrative tools for managing organization-wide sessions.
- Local encryption-at-rest for persisted chat/session data.
- Session trash, archive, or undo-restore workflows.
- Hard limits on sessions or messages per session (no cap enforced in this feature).

## Dependencies

- Model discovery and model selection capability from `specs/003-opencode-provider-config/spec.md`.
- Chat reply capability and usage data from `specs/002-ai-service/spec.md`.
- If usage fields are partially missing from upstream responses, UI must still render the reply and show `N/A` for missing usage fields.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: In a validation sample of at least 100 send attempts against a healthy local OpenCode server, at least 95% of attempts complete from send action to rendered reply in under 10 seconds.
- **SC-002**: In a validation sample of at least 100 assistant replies, 100% show usage values when provided upstream, or `N/A` when not provided, and session totals update after each reply.
- **SC-003**: In moderated usability testing with at least 20 representative users, at least 95% complete a full chat flow (send message, receive reply, view usage) on first attempt without facilitator intervention.
- **SC-004**: In a validation run of at least 50 session switches, at least 95% restore the correct history and model label in under 2 seconds.
