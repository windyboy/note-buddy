# Implementation Plan: Model Selection via OpenCode Server

**Branch**: `003-opencode-provider-config` | **Date**: 2026-01-28 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/003-opencode-provider-config/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Add model discovery and selection to the NoteBuddy Obsidian plugin. Users can discover available AI models from a local OpenCode server via a manual "Refresh Models" button, select a default model in settings, and have that selection persist across restarts. The selected model is included in message payloads when sending to the OpenCode server. The plugin gracefully handles unavailable models by falling back to server defaults with non-blocking notifications.

## Technical Context

**Language/Version**: TypeScript (ES2018+), Node 18+
**Primary Dependencies**: Obsidian API (^1.7.2), existing OpenCodeClient service
**Storage**: Obsidian's data.json (plugin settings persistence)
**Testing**: Vitest (bun test)
**Target Platform**: Obsidian desktop (Electron-based)
**Project Type**: Single project (Obsidian plugin)
**Performance Goals**: Model discovery <5 seconds, UI updates <100ms
**Constraints**: Must use Obsidian's requestUrl API (not fetch), 10-second API timeout, 5-minute model cache TTL
**Scale/Scope**: Support up to 50 models per provider, single-user desktop application

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

**Status**: Constitution file is a template placeholder. No specific principles defined yet for this project. Proceeding with standard best practices:
- Test-driven development approach
- Simple, focused implementation
- No over-engineering
- Clear error handling

**Re-evaluation required**: After Phase 1 design completion

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
├── main.ts              # Plugin entry point (existing)
├── models.ts            # Data models (existing, will extend)
├── settings.ts          # Settings UI (existing, will extend)
├── service.ts           # OpenCodeClient (existing, will extend)
└── chat-view.ts         # Chat interface (existing, minimal changes)

tests/
└── unit/
    ├── models.test.ts
    ├── service.test.ts
    └── settings.test.ts
```

**Structure Decision**: Single project structure (Obsidian plugin). This feature extends existing files rather than adding new modules. The core changes are in `service.ts` (model discovery API), `settings.ts` (UI for model selection), and `models.ts` (type definitions for model descriptors).

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

No violations. Implementation follows standard patterns and existing architecture.

---

## Phase 0: Research (Complete)

**Status**: ✅ Complete

**Output**: `research.md` with all technical decisions documented

**Key Decisions**:
- Use `/v1/capabilities` endpoint with provider hierarchy
- 5-minute in-memory cache with manual refresh
- Dropdown UI with grouped provider/model options
- Optional `ModelSelection` object in settings
- Best-effort model inclusion in message payloads
- Non-blocking error notifications

---

## Phase 1: Design & Contracts (Complete)

**Status**: ✅ Complete

**Outputs**:
- `data-model.md` - Entity definitions and state transitions
- `contracts/models-discovery-api.yaml` - OpenAPI specification
- `quickstart.md` - Implementation guide

**Key Artifacts**:
- Provider, Model, ModelSelection, NoteBuddySettings entities
- TypeScript interfaces for all data structures
- API contract for `/v1/capabilities` endpoint
- Step-by-step implementation guide with code examples

---

## Phase 2: Task Breakdown (Not Started)

**Status**: ⏸️ Pending - Use `/speckit.tasks` command

This phase generates `tasks.md` with actionable, dependency-ordered tasks for implementation.

---

## Constitution Re-Check

**Status**: ✅ Pass

No constitution violations introduced during design phase. Implementation:
- Extends existing architecture without over-engineering
- Uses established patterns (Obsidian API, TypeScript strict mode)
- Maintains simplicity (no unnecessary abstractions)
- Follows test-driven development approach

---

## Next Steps

1. Run agent context update: `.specify/scripts/bash/update-agent-context.sh claude`
2. Generate tasks: Use `/speckit.tasks` command
3. Begin implementation following `tasks.md`

---

## Summary

Planning complete for feature 003 (Model Selection via OpenCode Server). All design artifacts generated:
- Research findings document technical decisions
- Data model defines entities and relationships
- API contracts specify OpenCode integration
- Quickstart guide provides implementation steps

Ready to proceed with task generation and implementation.
