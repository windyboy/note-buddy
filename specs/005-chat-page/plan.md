# Implementation Plan: Standard Chat Page

**Branch**: `005-chat-page` | **Date**: 2026-02-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/005-chat-page/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Deliver a full chat page for the Obsidian plugin: streamed assistant replies with attribution and timestamps, session list (create/switch/rename/delete) with local persistence, per-session model selection, token usage per reply and per session, explicit loading state, and cancel-on-session-switch. Token budget is user-configurable in plugin settings; no caps on sessions or messages. Technical approach: extend existing ChatView/service layer with session CRUD, plugin.saveData/loadData for persistence, and streaming + AbortController for cancel behavior.

## Technical Context

**Language/Version**: TypeScript 5.9  
**Primary Dependencies**: Obsidian API 1.11.4, esbuild 0.27.2  
**Storage**: Obsidian plugin data (JSON via plugin.saveData/loadData); plain local storage, no encryption  
**Testing**: Vitest 1.x (unit + integration); tests in `tests/unit/`, `tests/integration/`, `tests/mocks/`  
**Target Platform**: Obsidian plugin (desktop); OpenCode API server at configurable URL (default 127.0.0.1:4096)  
**Project Type**: single (Obsidian plugin, single `src/` tree)  
**Performance Goals**: SC-001 95% of sends complete to rendered reply in &lt;10s; SC-004 95% of session switches restore in &lt;2s. SC-003 (usability) is validated post-launch. SC-001 and SC-004 can be checked via quickstart or manual validation (see tasks.md Phase 6, T025).  
**Constraints**: Single-user, no multi-user concurrency; no encryption at rest; token budget enforced client-side from settings  
**Scale/Scope**: No enforced limit on sessions or messages per session; design for normal usage

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

Constitution file (`.specify/memory/constitution.md`) is a placeholder template and not ratified. Project guidelines from **AGENTS.md** and **CLAUDE.md** apply: TypeScript strict mode, Vitest for tests, Obsidian plugin patterns, spec-driven structure. No constitution gates to enforce; no violations.

## Project Structure

### Documentation (this feature)

```text
specs/005-chat-page/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/          # Phase 1 output (/speckit.plan command)
│   └── chat-api.md
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── main.ts              # Plugin lifecycle, settings, session state registration
├── chat-view.ts         # Chat UI (or views/ChatView.ts), message list, input, streaming render
├── service.ts           # OpenCodeClient (API), model cache
├── settings.ts          # Service URL, model dropdown, token budget setting
├── models.ts            # TypeScript contracts (OpenCode API types)
└── styles.css           # Plugin styles

tests/
├── unit/                # e.g. service.test.ts, chat-service tests
├── integration/         # Chat flow, persistence, model switch
└── mocks/               # Obsidian API stub
```

**Structure Decision**: Single-project layout. Chat page lives in existing `src/` (and `src/views/` if used); session/message persistence and token budget are added to plugin settings/data. No new top-level backend/frontend split.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| (none) | — | — |
