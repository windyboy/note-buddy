# Implementation Plan: Opencode Client Interface

**Branch**: `001-opencode-client` | **Date**: 2025-01-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/001-opencode-client/spec.md`

## Summary

Implement a conversational interface for Obsidian that acts as a client for the Opencode server. This feature enables users to query their vault using natural language, receive grounded responses citing specific notes, maintain conversation history across sessions, and receive organizational suggestions (tags/links) based on note content analysis.

## Technical Context

**Language/Version**: TypeScript 5.6+  
**Primary Dependencies**: Obsidian API, Axios/Fetch, DOMPurify (for sanitization)  
**Storage**: Obsidian Data API (settings), Local JSON files (session history)  
**Testing**: Vitest/Jest (with Obsidian API mocks)  
**Target Platform**: Obsidian Plugin (Desktop/Mobile)
**Project Type**: single (Obsidian Plugin)  
**Performance Goals**: < 5s query response, < 30s indexing (1k notes), < 500ms local retrieval latency  
**Constraints**: < 100MB memory usage, strict XSS prevention, async non-blocking operations  
**Scale/Scope**: Support for vaults with up to 1,000 notes

## Constitution Check

_GATE: PASSED_

- **C-001: Obsidian Plugin Architecture**: [PASSED] Implementation extends `Plugin` and handles lifecycle correctly (see `quickstart.md`).
- **C-002: TypeScript Discipline**: [PASSED] Strict mode enabled; shared interfaces defined in `data-model.md`.
- **C-003: Test-First Development**: [PASSED] Vitest chosen for unit and integration testing (see `research.md`).
- **C-004: Async Safety**: [PASSED] Ky client and non-blocking indexing strategy confirmed (see `research.md`).
- **C-005: Error Handling**: [PASSED] Actionable errors and debug mode implemented in settings (see `data-model.md`).
- **C-006: Settings Management**: [PASSED] Schema and tab implementation defined (see `data-model.md`).
- **C-007: Security/Privacy**: [PASSED] Local-first storage and DOMPurify sanitization confirmed (see `research.md`).

## Project Structure

### Documentation (this feature)

```text
specs/001-opencode-client/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output
```

### Source Code (repository root)

```text
src/
├── main.ts              # Plugin entry point (Obsidian lifecycle)
├── settings/            # PluginSettingTab implementation
├── ui/                  # React/Svelte components or Obsidian View
│   ├── chat-view.ts     # Main conversation interface
│   └── components/      # Reusable UI elements (typing indicator, loading bar)
├── core/                # Business logic
│   ├── indexing/        # Vault indexing and streaming
│   ├── session/         # History management and persistence
│   └── query/           # Server communication and grounded response logic
├── models/              # TypeScript interfaces/types
└── utils/               # Sanitization, error handling, retries

tests/
├── unit/                # Core logic tests
├── integration/         # Simulated Obsidian environment tests
└── fixtures/            # Golden dataset (US3/SC-005)
```

**Structure Decision**: Single project structure tailored for an Obsidian plugin, separating UI from core indexing and server-communication logic to facilitate unit testing with mocks.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation                  | Why Needed         | Simpler Alternative Rejected Because |
| -------------------------- | ------------------ | ------------------------------------ |
| [e.g., 4th project]        | [current need]     | [why 3 projects insufficient]        |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient]  |
