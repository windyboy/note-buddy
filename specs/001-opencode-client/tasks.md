# Tasks: Opencode Client Interface

**Input**: Design documents from `/specs/001-opencode-client/`
**Project Type**: Personal project - Simple, pragmatic approach

## Format: `[ID] Description`

Each task is clear, actionable, and ready for immediate implementation.

---

## Phase 1: Project Setup (基础搭建)

**Goal**: Initialize project structure and configuration

- [X] T001 Create project directories: src/, src/models/, src/services/, src/ui/, src/utils/, tests/
- [X] T002 Initialize package.json with dependencies: obsidian, typescript 5.6+, ky
- [X] T003 Create tsconfig.json with strict mode and ES2022 target
- [X] T004 Create manifest.json for Obsidian plugin
- [X] T005 Configure esbuild for plugin bundling
- [X] T006 Create main.ts plugin skeleton extending Plugin class

---

## Phase 2: Core Models (核心数据模型)

**Goal**: Define all data types and interfaces

- [X] T007 Create type interfaces in src/models/types.ts: Session, Message, Note, Query, QueryResponse, PluginSettings
- [X] T008 Add API contract types in src/models/api-types.ts: QueryRequest, Response, Part types
- [X] T009 Create utility functions in src/utils/helpers.ts: generateId(), validators, debounce()
- [ ] T010 Create logger utility in src/utils/logger.ts

---

## Phase 3: Core Services (核心服务)

**Goal**: Implement server communication, vault access, and session management

- [X] T011 Implement OpencodeClient in src/services/opencode-service.ts: HTTP client, auth, endpoints
- [ ] T012 Implement VaultReader in src/services/vault-service.ts: file listing, metadata extraction, content parsing
- [X] T013 Implement SessionManager in src/services/session-service.ts: CRUD operations, persistence
- [ ] T014 Implement QueryEngine in src/services/query-engine.ts: build requests, parse responses
- [X] T015 Implement SettingsService in src/services/settings-service.ts: configuration management

---

## Phase 4: UI Components (用户界面)

**Goal**: Build Obsidian UI integration

- [X] T016 Create ChatView extending ItemView in src/ui/chat-view.ts: chat interface, message rendering
- [X] T017 Create SettingsTab in src/ui/settings.ts: server configuration, API key input
- [ ] T018 Integrate services with ChatView: connect OpencodeClient, SessionManager, QueryEngine
- [ ] T019 Display referenced notes in chat responses
- [X] T020 Add error handling and user-friendly messages
- [ ] T021 Add loading states and progress indicators

---

## Phase 5: Testing & Polish (测试和优化)

**Goal**: Basic validation and polish

- [X] T022 Create basic integration test in tests/integration/basic.test.ts: verify Opencode connectivity
- [ ] T023 Test vault indexing and query functionality
- [X] T024 Test session persistence and retrieval
- [X] T025 Add edge case handling: empty vault, network errors, malformed notes
- [ ] T026 Update README with installation instructions
- [ ] T027 Verify all P1 user stories work end-to-end

---

## Summary

**Total Tasks**: 27
**Phases**: 5 (Setup, Models, Services, UI, Test)
**Estimation**: 2-4 days for MVP

**MVP Scope (P1 Features)**:
- Phase 1-4 complete = 21 tasks
- Can start with Phase 1-3 (backend only) then add UI

**Parallel Opportunities**:
- T002, T003, T004, T005 can run in parallel
- T011, T012, T013, T014 can run in parallel (independent services)

**Notes**:
- Simple, linear progression - perfect for personal project
- Each phase can be tested independently
- Focus on working code over exhaustive documentation
