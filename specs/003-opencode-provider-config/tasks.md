# Tasks: Model Selection via OpenCode Server

**Input**: Design documents from `/specs/003-opencode-provider-config/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Tests are OPTIONAL - not explicitly requested in feature specification, so not included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Plugin**: `src/` at repository root (main.ts, chat-view.ts, service.ts, models.ts, settings.ts)

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create any new directories if needed per implementation plan
- [X] T002 [P] Add ModelDescriptor interface to src/models.ts
- [X] T003 [P] Add defaultModelId field to ServiceSettings interface in src/models.ts
- [X] T004 Configure error handling for model discovery failures in src/service.ts
- [X] T005 [US1] Add discovery method to src/service.ts for /v1/models endpoint
- [X] T006 [US1] Handle unsupported endpoint gracefully in src/service.ts
- [X] T007 [US1] Add model list caching to service.ts
- [X] T008 [US2] Add model dropdown to settings UI in src/settings.ts (depends on US1 discovery)
- [X] T009 [US2] Implement persistence of selection in src/settings.ts
- [X] T010 [US2] Handle single model auto-selection in src/settings.ts
- [X] T011 [US3] Update message send logic in src/service.ts to include selected model
- [X] T012 [US3] Handle case when no model selected in src/service.ts
- [X] T013 [US3] Handle server ignores model selection gracefully in src/service.ts
- [X] T014 Run lint and typecheck commands after implementation
- [ ] T015 [P] Documentation updates for new model selection features
- [ ] T016 Code cleanup and refactoring across modified files
- [ ] T017 Run quickstart.md validation scenarios

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 → P2 → P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) and US1 completion - Depends on US1 for model discovery
- **User Story 3 (P3)**: Can start after Foundational (Phase 2) and US2 completion - Depends on US2 for model selection

### Within Each User Story

- Models before services
- Services before endpoints
- Core implementation before integration
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- All Foundational tasks marked [P] can run in parallel (within Phase 2)
- Once Foundational phase completes, User Stories 1 and 2 can start in parallel (US3 depends on US2)
- Different user stories can be worked on in parallel by different team members

---

## Parallel Example: User Story 1

```bash
# Launch foundational tasks together:
Task: "Add ModelDescriptor interface to src/models.ts"
Task: "Add defaultModelId field to ServiceSettings interface in src/models.ts"
Task: "Configure error handling for model discovery failures in src/service.ts"
```

---

## Implementation Strategy

### MVP First (User Stories 1 & 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. Complete Phase 4: User Story 2
5. **STOP and VALIDATE**: Test User Stories 1 and 2 independently
6. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational → Foundation ready
2. Add User Story 1 → Test independently → Deploy/Demo (Partial MVP)
3. Add User Story 2 → Test independently → Deploy/Demo (Full MVP!)
4. Add User Story 3 → Test independently → Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2 (after US1 discovery available)
   - Developer C: User Story 3 (after US2 selection available)
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Commit after each task or logical group
- Stop at any checkpoint to validate story independently
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence