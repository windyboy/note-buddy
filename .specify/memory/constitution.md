<!--
Sync Impact Report:
Version: 1.0.0 (initial constitution)
Modified Principles: N/A (initial version)
Added Sections: All sections (initial creation)
Removed Sections: N/A
Templates Status:
  ✅ plan-template.md - Constitution Check section aligned
  ✅ spec-template.md - User story prioritization aligned
  ✅ tasks-template.md - Story-based organization aligned
Follow-up TODOs: None
-->

# NoteBuddy Constitution

## Core Principles

### I. Specification-Driven Development

All features MUST begin with a formal specification that defines user scenarios, acceptance criteria, and success metrics before any implementation begins. Specifications MUST be technology-agnostic and focus on what users need, not how to build it.

**Rationale**: Starting with clear requirements prevents scope creep, ensures alignment with user needs, and provides a testable contract for implementation success.

### II. Independent User Stories

Each user story MUST be independently testable, deliverable, and valuable on its own. Stories MUST be prioritized (P1, P2, P3...) to enable incremental delivery where implementing only P1 stories produces a viable MVP.

**Rationale**: Independent stories enable parallel development, reduce integration risk, allow early user feedback, and ensure continuous value delivery rather than big-bang releases.

### III. Obsidian Plugin Standards

All code MUST comply with Obsidian plugin API conventions and lifecycle requirements. The plugin MUST handle vault operations safely, respect user data integrity, and degrade gracefully when the Obsidian environment changes.

**Rationale**: Obsidian plugins operate in a constrained environment with specific APIs and user expectations. Non-compliance leads to plugin rejection, data corruption, or poor user experience.

### IV. Bun-First Development

Use Bun as the primary runtime and toolchain. Prefer Bun's built-in APIs (`Bun.file`, `Bun.serve`, `bun:sqlite`) over Node.js equivalents. Use `bun test` for testing, `bun build` for bundling, and `bunx` for package execution.

**Rationale**: Bun provides faster execution, simpler APIs, and better developer experience. Standardizing on Bun reduces tooling complexity and improves build performance.

### V. Error Handling & User Feedback

All error conditions MUST be handled gracefully with clear, actionable user messages. Network failures, file access errors, and API timeouts MUST NOT crash the plugin. Users MUST always understand what went wrong and what they can do about it.

**Rationale**: Obsidian users expect stable, reliable plugins. Cryptic errors or crashes erode trust and make debugging impossible for non-technical users.

## Quality Standards

### Testing Requirements

- **Unit Tests**: Required for business logic, data transformations, and utility functions
- **Integration Tests**: Required for API interactions, vault operations, and session management
- **Manual Testing**: Required for UI interactions and user workflows before release
- **Test Coverage**: Aim for >80% coverage on critical paths (query processing, session management, vault indexing)

### Performance Standards

- Query responses MUST complete within 5 seconds for typical vault sizes (up to 1,000 notes)
- Session operations (create, switch, delete) MUST complete within 3 seconds
- Vault indexing MUST complete within 30 seconds for vaults up to 1,000 notes
- UI interactions MUST feel responsive (<100ms feedback for user actions)

### Code Quality

- TypeScript MUST be used with strict mode enabled
- All public APIs MUST have type definitions
- Code MUST pass ESLint checks before commit
- Formatting MUST be consistent (use Prettier)

## Development Workflow

### Feature Development Process

1. **Specify** (`/speckit.specify`): Create formal specification with user stories and acceptance criteria
2. **Plan** (`/speckit.plan`): Generate technical plan, research findings, data models, and API contracts
3. **Tasks** (`/speckit.tasks`): Break plan into executable tasks organized by user story
4. **Implement** (`/speckit.implement`): Execute tasks with validation and testing
5. **Review**: Verify constitution compliance before merge

### Branch Strategy

- Feature branches MUST follow pattern: `###-feature-name` (e.g., `001-opencode-client`)
- Each feature branch corresponds to a specification in `specs/###-feature-name/`
- Main branch MUST always be in a releasable state

### Documentation Requirements

- Each feature MUST have: `spec.md`, `plan.md`, `tasks.md`
- Optional but recommended: `research.md`, `data-model.md`, `quickstart.md`, `contracts/`
- README MUST be updated when user-facing features change
- API contracts MUST be documented in OpenAPI format when applicable

## Governance

### Constitution Authority

This constitution supersedes all other development practices and guidelines. When conflicts arise between this constitution and other documentation, the constitution takes precedence.

### Amendment Process

1. Proposed amendments MUST be documented with rationale
2. Version MUST be incremented according to semantic versioning:
   - **MAJOR**: Backward-incompatible governance changes or principle removals
   - **MINOR**: New principles added or materially expanded guidance
   - **PATCH**: Clarifications, wording fixes, non-semantic refinements
3. All dependent templates MUST be updated to reflect amendments
4. A Sync Impact Report MUST be generated documenting changes

### Compliance Review

- All pull requests MUST verify compliance with constitution principles
- Constitution violations MUST be justified and documented if exceptions are granted
- Regular audits SHOULD be conducted to ensure ongoing compliance

### Version Control

**Version**: 1.0.0 | **Ratified**: 2026-01-23 | **Last Amended**: 2026-01-23
