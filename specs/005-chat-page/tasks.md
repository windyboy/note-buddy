---
description: "Task list for Standard Chat Page feature implementation"
---

# Tasks: Standard Chat Page

**Input**: Design documents from `specs/005-chat-page/`
**Prerequisites**: plan.md, spec.md, data-model.md, research.md, contracts/chat-api.md, quickstart.md

**Tests**: Not explicitly requested in the feature specification; no test tasks included. Add unit/integration tests as needed during implementation.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or methods, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (per plan.md)
- Chat UI: `src/chat-view.ts` (or `src/views/ChatView.ts` if consolidated)
- Service/API: `src/service.ts`; types: `src/models.ts`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Verify project readiness per implementation plan

- [X] T001 Verify project structure and build per plan.md (src/, tests/, manifest, esbuild; run `bun run build`)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core data types, persistence, and settings that MUST be complete before ANY user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T002 [P] Add ChatSession, ChatMessage, MessageUsage, SessionUsage, PluginData types to src/models.ts per data-model.md
- [X] T003 [P] Add tokenBudget field to ServiceSettings type and update src/settings.ts to use pluginData.settings instead of plugin.settings
- [X] T004 [P] Update src/main.ts to implement loadPluginData(), savePluginData(), and session management (createSession, setActiveSession, updateSession)
- [X] T005 [P] Define error types in src/models.ts (SessionNotFoundError, ValidationError, ModelUnavailableError, ModelNotFoundError, ApiError, TimeoutError, AbortError)
- [X] T006 [P] Add active session logic to ChatView; load and display active session on view load (loadChatState in src/chat-view.ts)
- [X] T007 [US1] Add session list UI (sidebar) with create, switch, delete in src/chat-view.ts; renderMessageList() to display messages from activeSession with sender attribution, timestamps, and streamed content

**Checkpoint**: Foundation ready — user story implementation can begin

---

## Phase 3: User Story 1 — Conduct a chat session (Priority: P1) 🎯 MVP

**Goal**: User can send a message and see streamed assistant replies with attribution, timestamps, and token usage.

**Independent Test**: Start a new session, send a message, verify a rendered reply with metadata (sender, timestamp, usage).

### Implementation for User Story 1

- [X] T006 [US1] Implement sendMessage(sessionId, content, options?: { signal }) with streaming and AbortSignal support in src/service.ts by extending existing OpenCodeClient (no separate chat-service module)
- [X] T007 [US1] Render message list with sender attribution, timestamps, and streamed content/usage in src/chat-view.ts
- [X] T008 [US1] Show explicit loading state ("Sending…" or spinner) and disable send until reply stream ends in src/chat-view.ts
- [X] T009 [US1] Persist user and assistant messages and session usage from src/service.ts by calling plugin.saveData() after each successful reply (plugin reference passed to service layer)
- [X] T010 [US1] Display token usage per reply and session total in src/chat-view.ts (show N/A when usage not provided)

**Checkpoint**: User Story 1 is fully functional — send message, see streamed reply, view usage

---

## Phase 4: User Story 2 — Manage sessions (Priority: P2)

**Goal**: User can create, switch, rename, and delete sessions; session list and active session state are correct.

**Independent Test**: Create two sessions, switch between them, rename one, delete the other; verify list and active session behavior.

### Implementation for User Story 2

- [X] T011 [P] [US2] Implement createSession in src/service.ts; add session to plugin data and set as active
- [X] T012 [US2] Implement switchSession(sessionId) in src/service.ts; cancel in-flight send for previous active session (abort signal)
- [X] T013 [P] [US2] Implement renameSession(sessionId, newName) in src/service.ts per contracts/chat-api.md
- [X] T014 [US2] Implement deleteSession(sessionId) in src/service.ts; if active session deleted, select another existing session or create new empty session
- [X] T015 [US2] Add session list UI (sidebar) with create, switch, rename, delete in src/chat-view.ts
- [X] T016 [US2] Wire AbortController so switching session aborts in-flight sendMessage; do not store partial reply; leave session history unchanged (src/chat-view.ts + service)

**Checkpoint**: User Stories 1 and 2 work — full session CRUD and switching

---

## Phase 5: User Story 3 — Choose model and understand usage (Priority: P3)

**Goal**: User can select the model for a session and see current model in header; usage visibility already covered in US1.

**Independent Test**: Change model for a session, send a message, verify new model is used and shown in header.

### Implementation for User Story 3

- [X] T017 [P] [US3] Implement changeModel(sessionId, modelId) in src/service.ts per contracts/chat-api.md
- [X] T018 [US3] Add model selector dropdown and show current model in session header in src/chat-view.ts
- [X] T019 [US3] Block send when selected model is unavailable; prompt user to choose an available model before retry (in send path or validation)

**Checkpoint**: All three user stories are independently functional

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Validation, error UX, and documentation

- [X] T020 Validate empty or whitespace-only input before send; show validation message in src/chat-view.ts
- [X] T021 Validate token budget before send (using settings); block send and show corrective guidance when exceeded in src/chat-view.ts or service
- [X] T022 Present user-friendly error states for failed replies with retry capability in src/chat-view.ts
- [X] T023 [P] Update quickstart.md or docs to match implementation (paths, component names)
- [X] T024 Run quickstart.md validation (manual or scripted)
- [X] T025 Document or run validation for success criteria SC-001 (95% send-to-reply &lt;10s) and SC-004 (95% session switch &lt;2s) per quickstart or manual check

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run first
- **Foundational (Phase 2)**: Depends on Setup — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational (T002–T005)
- **User Story 2 (Phase 4)**: Depends on Foundational; T012/T016 depend on T006 (sendMessage + abort)
- **User Story 3 (Phase 5)**: Depends on Foundational; T019 depends on send path (T006)
- **Polish (Phase 6)**: Depends on completion of desired user stories; T025 covers SC-001/SC-004 validation

### User Story Dependencies

- **US1 (P1)**: No dependency on US2/US3 — can implement after Foundational
- **US2 (P2)**: Requires T006 (sendMessage) for switchSession abort behavior
- **US3 (P3)**: Independent of US2; integrates with session header and send validation

### Within Each User Story

- US1: T006 (sendMessage) before T007–T010; T007–T010 can be ordered for UI and persistence
- US2: T011, T013 can run in parallel; T012, T014, T015, T016 build on session API and UI
- US3: T017 before T018, T019

### Parallel Opportunities

- Phase 2: T002 and T005 [P] can run in parallel
- Phase 4: T011 and T013 [P] can run in parallel
- Phase 5: T017 [P] can run in parallel with other story tasks if service layer is ready

---

## Parallel Example: User Story 1

```text
# After T006 (sendMessage) is done:
T007 "Render message list in src/chat-view.ts"
T008 "Show loading state in src/chat-view.ts"
# T009 and T010 follow (persist + display usage)
```

## Parallel Example: User Story 2

```text
# In same phase:
T011 "Implement createSession"
T013 "Implement renameSession"
# Then T012, T014, T015, T016 (switch, delete, UI, abort wiring)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Send message, see streamed reply, view usage
5. Demo or iterate

### Incremental Delivery

1. Setup + Foundational → foundation ready
2. Add User Story 1 → test chat flow → MVP
3. Add User Story 2 → test session management
4. Add User Story 3 → test model selection and usage
5. Polish → validation, errors, docs

### Optional Parallel Work

- After Foundational: one developer on US1 (sendMessage + UI), another on US2 (session CRUD + list UI), then US3 and polish.

---

## Notes

- [P] tasks = different files or methods, no ordering dependency
- [Story] label maps task to spec.md user story for traceability
- Each user story is independently testable per spec acceptance scenarios
- Commit after each task or logical group
- Spec: single-user, no concurrency; plain local storage; cancel on session switch; no partial reply stored
