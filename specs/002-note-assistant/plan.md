# Implementation Plan: Note Assistant Plugin

**Branch**: `002-note-assistant` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-note-assistant/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Obsidian plugin providing AI-powered note operations (summarization, task extraction, structure improvement, link suggestions) via local OpenCode API service. All operations require explicit user confirmation through inline annotations with accept/reject/edit controls.

## Technical Context

**Language/Version**: TypeScript (strict mode), Bun runtime
**Primary Dependencies**: Obsidian Plugin API, OpenCode API client (HTTP), Markdown parser
**Storage**: Obsidian vault (file-based), plugin settings (Obsidian API)
**Testing**: Bun test (>80% coverage: unit, integration, manual)
**Target Platform**: Obsidian desktop (Electron-based, cross-platform)
**Project Type**: Single project (Obsidian plugin)
**Performance Goals**: <5s operation completion (≤5k words), <1s preview render, non-blocking UI
**Constraints**: Local OpenCode service required (e.g., localhost:8000), sequential operation processing, offline mode disabled
**Scale/Scope**: Single-note operations, vault-wide link search, notes typically 100-5k words (chunked >10k)

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: Specification-Driven Development
✅ **PASS** - Complete specification exists at `specs/002-note-assistant/spec.md` with technology-agnostic requirements, 4 prioritized user stories, measurable success criteria, and validated checklist.

### Principle II: Independent User Stories
✅ **PASS** - Four independent user stories (US1-US4) with P1-P3 priorities: Summarize (P1), Extract Tasks (P1), Improve Structure (P2), Suggest Links (P3). Each story is independently testable and deliverable.

### Principle III: Obsidian Plugin API Compliance
✅ **PASS** - Requirements specify Obsidian Plugin API usage (FR-001 command palette, FR-002 editor access, FR-010 markdown preservation). Graceful degradation specified in reliability requirements and edge cases.

### Principle IV: Bun-First Development
✅ **PASS** - Technical context specifies Bun runtime, Bun test framework, and TypeScript strict mode. Will use Bun's built-in HTTP client for OpenCode API integration.

### Principle V: Error Handling & User Feedback
✅ **PASS** - FR-008 loading indicators, FR-009 error messages with manual retry, FR-017 offline detection with clear error messages. Reliability requirements mandate graceful handling and actionable error messages.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
src/
├── plugin.ts              # Main plugin class (Obsidian Plugin lifecycle)
├── commands/              # Command palette handlers
│   ├── summarize.ts
│   ├── extract-tasks.ts
│   ├── improve-structure.ts
│   └── suggest-links.ts
├── services/              # Business logic
│   ├── opencode-client.ts # OpenCode API integration
│   ├── operation-queue.ts # Sequential operation processing
│   └── session-manager.ts # Global session tracking
├── ui/                    # User interface components
│   ├── annotations.ts     # Inline annotation rendering
│   └── loading.ts         # Loading indicators
├── models/                # Data structures
│   ├── operation.ts       # Operation types and results
│   └── preview.ts         # Preview state management
└── utils/                 # Utilities
    ├── markdown.ts        # Markdown parsing/manipulation
    └── chunking.ts        # Large note chunking (>10k words)

tests/
├── unit/                  # Unit tests (Bun test)
├── integration/           # Integration tests with mock OpenCode
└── manual/                # Manual test scenarios
```

**Structure Decision**: Single project structure for Obsidian plugin. Standard plugin architecture with main plugin class, command handlers, services layer for OpenCode integration and operation management, UI components for inline annotations, and utilities for markdown processing.

## Complexity Tracking

N/A - All constitution principles pass without violations.
