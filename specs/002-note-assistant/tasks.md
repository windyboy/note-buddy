# Tasks: Note Assistant Plugin

**Input**: Design documents from `/specs/002-note-assistant/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `- [ ] [ID] [P?] [Story?] Description`

- **[P]**: Parallelizable (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4)
- Exact file paths required

---

## Phase 1: Setup

**Purpose**: Project initialization

- [ ] T001 Create project structure: src/{commands,services,ui,models,utils}/, tests/, manifest.json
- [ ] T002 Initialize tsconfig.json with strict mode and Obsidian types
- [ ] T003 [P] Install dependencies: obsidian, @codemirror/view via bun install
- [ ] T004 [P] Configure package.json with build scripts and test framework
- [ ] T005 [P] Create manifest.json: id=note-assistant, minAppVersion=1.0.0
- [ ] T006 [P] Create .gitignore: node_modules/, dist/, .obsidian/

---

## Phase 2: Foundational

**Purpose**: Core infrastructure required before any user story

**⚠️ CRITICAL**: Complete before user story work begins

### Models & Types

- [ ] T007 [P] Create operation models in src/models/operation.ts: OperationType, OperationStatus, ErrorCode enums; OperationRequest, OperationResult, Suggestion, Position, OperationError interfaces
- [ ] T008 [P] Create preview models in src/models/preview.ts: PreviewState, Annotation, Decision interfaces; DecisionAction enum; currentSuggestionIndex field
- [ ] T009 [P] Create settings model in src/models/settings.ts: NoteAssistantSettings interface, DEFAULT_SETTINGS constant

### Core Services

- [ ] T010 Create main plugin class in src/plugin.ts: onload/onunload lifecycle, settings management, command registration
- [ ] T011 Create OpenCodeClient in src/services/opencode-client.ts: constructor(endpoint), createSession(), sendMessage(), deleteSession()
- [ ] T012 Create OperationQueue in src/services/operation-queue.ts: enqueue(), processQueue(), cancel() with AbortController, session lifecycle management

### Utilities

- [ ] T014 [P] Create markdown utilities in src/utils/markdown.ts: line-based parsing, heading detection, section finding/creation

### UI Components

- [ ] T016 [P] Create AnnotationWidget in src/ui/annotations.ts: extends CodeMirror WidgetType, toDOM() rendering, Accept/Reject/Edit buttons, sequential display with next/prev navigation
- [ ] T017 [P] Create loading overlay in src/ui/loading.ts: semi-transparent editor overlay with spinner
- [ ] T018 [P] Create banner notification in src/ui/banner.ts: queue status display, cancel button
- [ ] T019 [P] Create styles.css: annotation styling (light yellow/blue #FFF9E6/#E6F3FF), overlay (rgba(0,0,0,0.1)), banner

### Infrastructure Setup

- [ ] T020 Create VaultCache in src/services/vault-cache.ts: app.vault.getMarkdownFiles(), event-driven updates (create/delete/rename)
- [ ] T021 Implement settings tab in src/plugin.ts: endpoint URL input, "Test Connection" button, relaxed URL validation
- [ ] T022 Add health check in src/services/opencode-client.ts: GET /global/health before operations
- [ ] T023 Add offline detection in src/plugin.ts: disable operations, show error message
- [ ] T024 [P] Add text selection support (not just full note) in all commands: extract selected text, fallback to full note

**Checkpoint**: Foundation complete - user stories can begin

---

## Phase 3: User Story 1 - Summarize Note (P1) 🎯 MVP

**Goal**: Generate 3-5 bullet summary with inline annotation for approval

**Test**: Multi-paragraph note → trigger command → verify annotation with summary → test accept/reject/edit

- [ ] T025 [P] [US1] Create summarize command in src/commands/summarize.ts: extract note content, build prompt template
- [ ] T026 [US1] Register "Note Assistant: Summarize" in src/plugin.ts
- [ ] T027 [US1] Integrate command with OperationQueue.enqueue() in src/commands/summarize.ts
- [ ] T028 [US1] Parse AI response for summary bullets in src/commands/summarize.ts
- [ ] T029 [US1] Create annotation at note top with Accept/Reject/Edit handlers in src/commands/summarize.ts
- [ ] T030 [US1] Add loading overlay and error handling: empty response ("Note too short"), session failure (retry button)

**Checkpoint**: US1 complete - summarize fully functional

---

## Phase 4: User Story 2 - Extract Tasks (P1)

**Goal**: Extract action items with markdown checkbox formatting

**Test**: Note with "need to", "remember to" → trigger command → verify task extraction in Tasks section

- [ ] T031 [P] [US2] Create extract-tasks command in src/commands/extract-tasks.ts: build prompt, parse task items
- [ ] T032 [US2] Register "Note Assistant: Extract Tasks" in src/plugin.ts
- [ ] T033 [US2] Format tasks with markdown checkboxes, find/create Tasks section in src/commands/extract-tasks.ts
- [ ] T034 [US2] Create annotations with Accept handler for Tasks section insertion
- [ ] T035 [US2] Add loading overlay and empty response handling ("No tasks found")

**Checkpoint**: US2 complete - extract tasks functional

---

## Phase 5: User Story 3 - Improve Structure (P2)

**Goal**: Suggest structural improvements with before/after preview

**Test**: Unstructured note → trigger command → verify suggestions with previews → test individual accept/reject

- [ ] T036 [P] [US3] Create improve-structure command in src/commands/improve-structure.ts: build prompt, parse structure suggestions
- [ ] T037 [US3] Register "Note Assistant: Improve Structure" in src/plugin.ts
- [ ] T038 [US3] Implement sequential suggestion display in src/commands/improve-structure.ts: one at a time, progress indicator "X of Y"
- [ ] T039 [US3] Create annotations with before/after preview, next/prev navigation
- [ ] T040 [US3] Add loading overlay and empty response handling ("Note structure looks good")

**Checkpoint**: US3 complete - improve structure functional

---

## Phase 6: User Story 4 - Suggest Links (P3)

**Goal**: Find related notes vault-wide, suggest wiki-links with explanations

**Test**: Note with topics → trigger command → verify vault search → test link suggestions with edit capability

- [ ] T041 [P] [US4] Create suggest-links command in src/commands/suggest-links.ts: build prompt with vault note list, parse link suggestions
- [ ] T042 [US4] Register "Note Assistant: Suggest Links" in src/plugin.ts
- [ ] T043 [US4] Create annotations with link explanations, Edit handler for link text/target modification
- [ ] T044 [US4] Implement Accept handler to insert wiki-links [[note-title]]
- [ ] T045 [US4] Add loading overlay and empty response handling ("No related notes found")

**Checkpoint**: US4 complete - suggest links functional

---

## Phase 7: Polish

**Purpose**: Edge cases and enhancements

- [ ] T046 [P] Handle special markdown (tables, math, code blocks) in src/utils/markdown.ts

---

## Dependencies & Execution Order

### Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational) → Phase 3-6 (User Stories) → Phase 7 (Polish)
                                          ↓
                                    US1 (P1) ← MVP
                                    US2 (P1)
                                    US3 (P2)
                                    US4 (P3)
```

### User Story Dependencies

- **US1-US4**: All independent after Phase 2 completes
- **Parallel**: US1, US2, US3, US4 can be implemented simultaneously

---

## Parallel Execution Examples

### Phase 1: Setup
```
T003, T004, T005, T006 (all parallel)
```

### Phase 2: Foundational
```
Parallel Group 1 (Models & UI):
T007, T008, T009, T014, T016, T017, T018, T019, T024

Sequential:
T010 (plugin) → T011 (client) → T012 (queue)
T020 (vault cache) → T021, T022, T023 (infrastructure)
```

### Phase 3-6: User Stories
```
Each story: Command creation [P] → Registration → Integration → Handlers
US1, US2, US3, US4 can run in parallel after Phase 2
```

### Phase 7: Polish
```
T046 (single task)
```

---

## Implementation Strategy

### MVP Scope

**Recommended MVP**: Phase 1 + Phase 2 + Phase 3 (US1 - Summarize) = 30 tasks

Provides:
- Complete plugin infrastructure
- One fully functional operation (summarize)
- All core components validated
- Testable end-to-end workflow

**Rationale**: US1 validates entire architecture. US2-US4 follow same pattern.

### Incremental Delivery

1. **Sprint 1**: Phase 1 + Phase 2 (Foundation) - 24 tasks
2. **Sprint 2**: Phase 3 (US1) - 6 tasks → MVP
3. **Sprint 3**: Phase 4 (US2) - 5 tasks
4. **Sprint 4**: Phase 5 (US3) - 5 tasks
5. **Sprint 5**: Phase 6 (US4) - 5 tasks
6. **Sprint 6**: Phase 7 (Polish) - 1 task

---

## Testing Strategy

### Unit Tests (Bun test)

**Target**: >80% coverage

Key areas:
- Markdown utilities (src/utils/markdown.ts)
- Operation queue (src/services/operation-queue.ts)
- OpenCode client (src/services/opencode-client.ts)

### Integration Tests

Mock OpenCode API:
- Session creation/deletion workflow
- Message sending and response parsing
- Error handling (connection refused, timeout)

### Manual Testing

**US1 - Summarize**:
- Multi-paragraph note → summary bullets
- Accept → inserted at top
- Reject → no changes
- Edit → modify before accepting

**US2 - Extract Tasks**:
- "need to", "remember to" → task extraction
- Accept → Tasks section with checkboxes
- Empty → "No tasks found"

**US3 - Improve Structure**:
- Unstructured note → suggestions
- Sequential display → one at a time
- Navigation → next/prev buttons

**US4 - Suggest Links**:
- Topics → vault search
- Edit → modify link before accepting
- Accept → wiki-links inserted

**Edge Cases**:
- Empty note → error message
- Note >10k words → show warning, may have performance issues
- Concurrent operations → queued
- OpenCode offline → error message

---

## Task Summary

**Total Tasks**: 45 (reduced from 107, further simplified)

### Tasks by Phase
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 18 tasks (includes text selection support)
- Phase 3 (US1 - Summarize): 6 tasks
- Phase 4 (US2 - Extract Tasks): 5 tasks
- Phase 5 (US3 - Improve Structure): 5 tasks
- Phase 6 (US4 - Suggest Links): 5 tasks
- Phase 7 (Polish): 1 task

### Tasks by User Story
- US1 (Summarize - P1): 6 tasks
- US2 (Extract Tasks - P1): 5 tasks
- US3 (Improve Structure - P2): 5 tasks
- US4 (Suggest Links - P3): 5 tasks
- Infrastructure: 24 tasks

### Key Improvements
- **Consolidated**: 107 → 45 tasks (58% reduction)
- **Removed duplication**: US tasks focus on command logic only
- **Removed chunking**: MVP phase removed (simplified)
- **Removed global session**: MVP phase removed (simplified)
- **Moved text selection**: Phase 7 → Phase 2 (early implementation)
- **Moved CSS**: Phase 7 → Phase 2 (with UI components)
- **One task per file**: Models, utilities consolidated

### Parallel Opportunities
- Phase 1: 4 tasks parallel
- Phase 2: ~10 tasks parallel (models, utilities, UI, text selection)
- Phase 3-6: All 4 user stories parallel after Phase 2
- Phase 7: 1 task

### MVP Recommendation
**Phases 1 + 2 + 3** = 30 tasks for working MVP with summarize feature

---

**Generated**: 2026-01-23
**Refined**: Professional consolidation, removed duplication, optimized dependencies
**Format**: ✅ All tasks follow checklist format with IDs, [P] markers, [Story] labels, file paths
**Ready for**: Implementation via /speckit.implement

