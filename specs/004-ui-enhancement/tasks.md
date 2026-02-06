---
description: "Task list for UI Enhancement"
---

# Tasks: UI Enhancement

**Input**: Design documents from `/Users/windy/Projects/ai/note-buddy/specs/004-ui-enhancement/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/, quickstart.md

**Tests**: Not requested in spec; no test tasks included.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Confirm shared assets and styling foundation

- [X] T001 Ensure `src/styles.css` includes the NB base styles and is bundled by the plugin build

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared types and persistence needed by chat-related stories

- [X] T002 Define/align `UiMessage` and `UIState` types with data-model in `src/models.ts`
- [X] T003 Implement chat state save/load (messages + session state) in `src/chat-view.ts`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Professional Chat Interface (Priority: P1) 🎯 MVP

**Goal**: A professional chat interface with bubbles, loading/error states, markdown rendering, and auto-scroll behavior.

**Independent Test**: 打开聊天视图，发送消息，验证消息气泡、加载状态、错误提示、空白态与自动滚动行为。

### Implementation for User Story 1

- [X] T004 [US1] Build chat layout structure (toolbar, message stage, composer bar) in `src/chat-view.ts`
- [X] T005 [P] [US1] Implement message rendering (bubbles, markdown, loading/error) in `src/chat-view.ts`
- [X] T006 [P] [US1] Implement auto-scroll + “新消息”提示逻辑 in `src/chat-view.ts`
- [X] T007 [P] [US1] Implement chat UI styles (layout, bubbles, loading, empty state, indicator) in `src/styles.css`

**Checkpoint**: User Story 1 is fully functional and independently testable

---

## Phase 4: User Story 2 - Clean Settings Panel (Priority: P1)

**Goal**: A clear settings panel with grouped sections, URL validation, model selection, and connection testing.

**Independent Test**: 打开设置面板，修改各项设置，验证 URL 校验、测试连接反馈与模型刷新。

### Implementation for User Story 2

- [X] T008 [US2] Build settings groups and section titles in `src/settings.ts`
- [X] T009 [US2] Implement Service URL format validation + inline error/success in `src/settings.ts`
- [X] T010 [US2] Implement “Test Connection” UI and feedback in `src/settings.ts`
- [X] T011 [US2] Implement provider-grouped model dropdown + refresh flow in `src/settings.ts`

**Checkpoint**: User Story 2 is fully functional and independently testable

---

## Phase 5: User Story 3 - Chat Toolbar (Priority: P2)

**Goal**: Toolbar actions for clearing chat with confirmation and session reset.

**Independent Test**: 使用工具栏按钮，验证清空确认、消息清空、会话重置与空白态提示。

### Implementation for User Story 3

- [X] T012 [US3] Implement clear chat confirmation + session reset in `src/chat-view.ts`
- [X] T013 [P] [US3] Add toolbar icon button + styles in `src/chat-view.ts` and `src/styles.css`

**Checkpoint**: User Story 3 is fully functional and independently testable

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final verification and documentation sync

- [X] T014 [P] Validate quickstart steps and update `specs/004-ui-enhancement/quickstart.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational completion
- **User Story 2 (Phase 4)**: Depends on Foundational completion
- **User Story 3 (Phase 5)**: Depends on Foundational completion; relies on chat UI from US1
- **Polish (Phase 6)**: Depends on desired user stories being complete

### User Story Dependencies

- **US1 (P1)**: No dependency on other stories
- **US2 (P1)**: No dependency on other stories
- **US3 (P2)**: Depends on US1 chat UI structure

### Parallel Opportunities

- T005, T006, T007 can proceed in parallel after T004 if separated by file scope
- T008–T011 can proceed independently within US2 after Foundational completion
- T013 can proceed in parallel with T012 once toolbar structure is in place

---

## Parallel Example: User Story 1

```bash
# Launch chat UI tasks in parallel (different files):
Task: "Implement message rendering (bubbles, markdown, loading/error) in src/chat-view.ts"
Task: "Implement auto-scroll + '新消息' 提示逻辑 in src/chat-view.ts"
Task: "Implement chat UI styles in src/styles.css"
```

---

## Parallel Example: User Story 2

```bash
# Settings tasks in parallel where possible:
Task: "Implement Service URL validation in src/settings.ts"
Task: "Implement model dropdown + refresh flow in src/settings.ts"
```

---

## Parallel Example: User Story 3

```bash
# Toolbar tasks in parallel:
Task: "Implement clear chat confirmation + session reset in src/chat-view.ts"
Task: "Add toolbar icon button + styles in src/chat-view.ts and src/styles.css"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Verify US1 independently

### Incremental Delivery

1. Setup + Foundational → Foundation ready
2. US1 → Validate
3. US2 → Validate
4. US3 → Validate
5. Polish → Documentation verified
