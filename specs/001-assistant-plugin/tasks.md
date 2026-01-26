# Tasks: Note Buddy – Initial UI (Refined)

**Input**: `/specs/001-assistant-plugin/`  
**Testing**: Manual only  
**MVP Scope**: User Stories 1 & 2 (P1)

---

## Phase 1: Setup

- [X] T001 Create project structure (`src/`, `src/views/`) and base config files
- [X] T002 Initialize TypeScript project with Obsidian dependency (Bun)
- [X] T003 [P] Configure tsconfig.json (strict, ES6+)
- [X] T004 [P] Configure esbuild for Obsidian plugin
- [X] T005 [P] Create manifest.json (id: `note-buddy`)
- [X] T006 [P] Create package.json with build scripts

**Checkpoint**: Plugin builds successfully ✓

---

## Phase 2: Foundation

- [X] T007 Create Plugin class in `src/main.ts` (`onload`, `onunload`)
- [X] T008 [P] Create empty `styles.css`
- [X] T009 Register view type constant `note-buddy-chat`

**Checkpoint**: Plugin enables cleanly in Obsidian ✓

---

## Phase 3: User Story 1 – Open Chat View from Ribbon (P1)

**Goal**: Open or focus a single chat view via ribbon icon

- [X] T010 [P][US1] Create `ChatView` class extending `ItemView`
- [X] T011 [US1] Register `ChatView` in `Plugin.onload`
- [X] T012 [US1] Add ribbon icon (Lucide: `bot`) in `Plugin.onload`
- [X] T013 [US1] Implement idempotent (no duplicates) view activation (no duplicates)
- [X] T014 [US1] Ensure right sidebar is revealed when activating
- [X] T015 [US1] Clean up view on `Plugin.onunload`

**Checkpoint**:
Ribbon icon reliably opens or focuses a single chat view. ✓

---

## Phase 4: User Story 2 – Basic Chat UI Layout (P1)

**Goal**: Render static chat UI with basic send behavior

- [X] T016 [US2] Implement `getViewType()` and `getDisplayText()` in `ChatView`
- [X] T017 [US2] Implement `onOpen()` to render:
  - header ("Note Buddy")
  - scrollable message container
  - input bar (textarea + Send button)
- [X] T018 [US2] Implement send behavior:
  - Enter sends, Shift+Enter inserts newline
  - Log message to console
  - Clear textarea
- [X] T019 [US2] Implement `onClose()` cleanup

- [X] T020 [US2] Apply flex layout and Obsidian CSS variables in `styles.css`

**Checkpoint**:
Chat UI renders correctly and behaves as expected in light/dark themes. ✓

---

## Phase 5: Validation & Polish

- [ ] T021 Manual test: ribbon open/focus/reopen behavior
- [ ] T022 Manual test: chat layout, keyboard handling
- [ ] T023 Manual test: no duplicate views possible
- [X] T024 Build and load plugin once more to confirm clean state ✓

---

## Stop Condition (Important)

When:
- User Story 1 works
- User Story 2 works
- Manual checks pass

**Stop.**  
Next functionality (OpenCode, streaming, persistence) must be a new spec.
