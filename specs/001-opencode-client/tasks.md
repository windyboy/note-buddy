# Task Plan: Opencode Client Interface

This document outlines the phased implementation of the Opencode client interface for Obsidian, prioritizing core connectivity and grounded note querying.

## Implementation Strategy

We follow an incremental delivery model:

1.  **MVP (US0, US1, US2)**: Establish connectivity, indexing, and multi-turn chat.
2.  **Extended Features (US3, US4)**: Add session management and organizational suggestions.
3.  **Polish**: Finalize UI transitions, error handling, and performance tuning.

Tasks are prioritized by user story (US) importance and sequential dependencies.

## Dependencies

- **US0** is the prerequisite for all other stories (requires server communication).
- **Foundational Phase** must be completed before any User Story phase.
- **US1** is the prerequisite for **US2** (requires query grounding logic).

## Phase 1: Setup

Goal: Initialize the development environment and project scaffolding.

- [x] T001 Initialize `package.json` with Obsidian and build dependencies in repo root
- [x] T002 [P] Configure `tsconfig.json` for TypeScript 5.6 strict mode in repo root
- [x] T003 [P] Create `manifest.json` with plugin metadata in repo root
- [x] T004 [P] Setup Vitest configuration for unit testing in `vitest.config.ts`
- [x] T005 Create directory structure: `src/{models,services,ui,core,utils}` and `tests/` in repo root

## Phase 2: Foundational

Goal: Implement the core data structures and shared services.

- [x] T006 Define core data models (Session, Message, Note) in `src/models/types.ts`
- [x] T007 Implement base `OpencodeService` using Ky for HTTP requests in `src/services/opencode-service.ts`
- [x] T008 [P] Implement `VaultService` for Obsidian file system access in `src/services/vault-service.ts`
- [x] T009 Implement `StateManager` for plugin data persistence in `src/core/session/state-manager.ts`
- [x] T010 Implement `ChatView` as an Obsidian `ItemView` boilerplate in `src/ui/chat-view.ts`

## Phase 3: User Story 0 - Connectivity (Priority: P1)

Goal: Establish connection to the Opencode server and verify status.
Independent Test: Use the settings tab to check connectivity and see a "Connected" status.

- [x] T011 [US0] Implement settings tab for URL and API Key in `src/settings/settings-tab.ts`
- [x] T012 [US0] Implement health check logic in `src/services/opencode-service.ts`
- [x] T013 [US0] Implement basic chat input and message rendering in `src/ui/chat-view.ts`
- [x] T014 [US0] Handle connection timeouts and server-down scenarios in `src/ui/chat-view.ts`
- [x] T015 [P] [US0] Create unit tests for server connectivity in `tests/unit/connectivity.test.ts`

## Phase 4: User Story 1 - Query Notes (Priority: P1)

Goal: Provide grounded answers based on local vault content.
Independent Test: Ask a question about a specific note and receive an answer citing that note.

- [x] T016 [US1] Implement streaming vault indexer with progress reporting in `src/core/indexing/indexer.ts`
- [x] T017 [US1] Implement grounding logic to attach note context to queries in `src/core/query/query-engine.ts`
- [x] T018 [US1] Implement note citation rendering (clickable links) in `src/ui/components/message-list.ts`
- [x] T019 [US1] Integrate DOMPurify for sanitizing note snippets in `src/utils/sanitizer.ts`
- [x] T020 [US1] Implement indexing progress bar UI in `src/ui/components/loading-bar.ts`
- [x] T021 [P] [US1] Create unit tests for indexing and grounding logic in `tests/unit/indexing.test.ts`

## Phase 5: User Story 2 - Conversation Context (Priority: P1)

Goal: Maintain chat history for follow-up questions.
Independent Test: Verify that the LLM remembers the context of previous turns in a conversation.

- [x] T022 [US2] Implement message history tracking in `src/core/session/session-manager.ts`
- [x] T023 [US2] Update `OpencodeService` to pass session history in query requests in `src/services/opencode-service.ts`
- [x] T024 [P] [US2] Create integration tests for multi-turn conversations in `tests/integration/context.test.ts`

## Phase 6: User Story 4 - Manage Sessions (Priority: P2)

Goal: Save, load, and switch between chat sessions.
Independent Test: Switch between two distinct sessions and verify history persists for each.

- [x] T025 [US4] Implement session persistence and loading logic in `src/core/session/state-manager.ts`
- [x] T026 [US4] Implement session sidebar/list for switching conversations in `src/ui/components/session-list.ts`
- [x] T027 [US4] Implement session deletion and auto-archiving in `src/core/session/archiver.ts`

## Phase 7: User Story 3 - Organize Notes (Priority: P2)

Goal: Receive tag and link suggestions based on note content.
Independent Test: Verify that suggestions appear in the chat UI when relevant content is discussed.

- [x] T028 [US3] Parse suggestions from API responses in `src/services/opencode-service.ts`
- [x] T029 [US3] Implement suggestion cards (tags/links) in `src/ui/components/suggestion-view.ts`

## Phase 8: Polish & Validation

Goal: Finalize UI/UX and ensure robustness.

- [x] T030 Implement "typing" status indicator for better UX in `src/ui/components/typing-indicator.ts`
- [x] T031 Add "Debug Mode" toggle with detailed trace logging in `src/settings/settings-tab.ts`
- [x] T032 Final CSS polish for Obsidian native look and feel in `styles.css`
- [x] T033 Verify all user stories against original specification in repo root

## Parallel Execution Examples

- **Setup & Foundational**: T002-T004 can run in parallel while T001 is processing.
- **US0 Implementation**: T011 and T012 can be developed simultaneously.
- **US1 Polish**: T019 and T020 can be implemented in parallel.
