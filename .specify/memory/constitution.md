<!--
SYNC IMPACT REPORT
- Version change: [initial] → 1.0.0
- Modified principles: None (initial version)
- Added sections: All sections (initial version)
- Removed sections: None
- Templates requiring updates: None (initial version)
- Follow-up TODOs: None
-->

# Note Buddy Constitution

## Core Principles

### I. Obsidian Plugin Architecture (NON-NEGOTIABLE)

All features MUST follow Obsidian plugin architecture. Plugins MUST extend `Plugin`, implement `onload`/`onunload`, use Obsidian UI APIs (modals/workspace), use `loadData`/`saveData` for state, and clean up listeners/intervals/DOM on unload.

### II. TypeScript Discipline

All code MUST be TypeScript with strict mode. All function params/returns and complex structures MUST be explicitly typed. Avoid `any` (use `unknown` or unions). Shared types MUST be extracted to interfaces. `tsconfig.json` MUST enable `strictNullChecks`, `strictFunctionTypes`, and `noImplicitAny`.

### III. Test-First Development

Write unit tests before new features (TDD). Tests MUST cover command handlers, event callbacks, and data transforms. Use mocks for Obsidian APIs/workspace. Add integration tests for simulated Obsidian behavior. Run tests via `npm test` in CI.

### IV. Async Safety and Performance

All I/O MUST be async and non-blocking. Long operations MUST surface status/progress. Debounce/throttle state writes. Clean up listeners. Respond to workspace changes within 100ms.

### V. Error Handling and User Communication

Wrap user-facing operations in try/catch. Log errors with context using Obsidian logging or `console.error`. User errors MUST be clear/actionable (localized where possible). Optional feature failures MUST degrade gracefully. Include a "debug mode" setting.

### VI. Settings and Configuration Management

Use `PluginSettingTab` for settings. Provide defaults, validate on change, and persist immediately. Version the settings schema for migrations. Provide clear setting descriptions. Expose settings via API.

## Security and Privacy

Do not collect/transmit/store user data outside the vault without explicit consent. Store plugin data locally via Obsidian data API. Respect Obsidian sandboxing. Do not execute untrusted code (no remote scripts/eval). Sanitize and validate all user input.

## Development Workflow

All new features MUST begin with a spec in `specs/` using `spec-template.md` and include user stories, acceptance criteria, and edge cases. Implementation MUST follow `/speckit.plan`. Before commit: pass ESLint and TypeScript (`npm run lint`, `npm run typecheck`). Commits MUST use conventional format. PRs MUST reference the spec.

## Governance

This constitution overrides all other dev practices. All code changes MUST comply. Any violation of NON-NEGOTIABLE items requires explicit justification and documented trade-offs in the relevant spec/plan.

Amendments require:
1. Rationale documented
2. SemVer bump (MAJOR removal/redefinition, MINOR addition/expansion, PATCH clarification)
3. Maintainer review/approval
4. Migration plan for breaking changes
5. Update `LAST_AMENDED_DATE` in this file

All PRs/code reviews must verify compliance. Track technical debt with justification/remediation. See `.kiro/steering/project.md` and `.kiro/steering/tech.md` for runtime guidance.

**Version**: 1.0.0 | **Ratified**: 2026-01-21 | **Last Amended**: 2026-01-21
