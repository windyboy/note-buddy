<!--
# Sync Impact Report
**Version Change**: [TEMPLATE] → 1.0.0
**Type**: Initial ratification

**Modified Principles**:
- None (initial version)

**Added Sections**:
- Core Principles (5 principles)
- Development Standards
- Governance

**Removed Sections**:
- None

**Templates Requiring Updates**:
- ✅ `.specify/templates/plan-template.md` - Constitution Check section aligned
- ✅ `.specify/templates/spec-template.md` - No changes needed
- ✅ `.specify/templates/tasks-template.md` - No changes needed

**Follow-up TODOs**:
- None
-->

# Note Buddy Constitution

## Core Principles

### I. Plugin Architecture & Integration

All components must integrate cleanly with Obsidian's plugin architecture. Plugins must:
- Extend Obsidian's Plugin base class with proper lifecycle management (load, unload)
- Use Obsidian's API exclusively for file operations, view management, and data access
- Respect Obsidian's event system and hook registration patterns
- Avoid direct DOM manipulation when Obsidian API alternatives exist
- Ensure thread safety when accessing vault resources

**Rationale**: Obsidian plugins run in a shared environment with other plugins. Following Obsidian's API patterns ensures stability, avoids conflicts, and provides consistent behavior across Obsidian versions.

### II. Data Model & Storage

Data management must follow Obsidian's storage conventions and ensure data integrity:
- Store plugin data in Obsidian's data directory using the loadData/saveData API
- Use YAML frontmatter for note-level metadata when appropriate
- Implement proper data validation before storage
- Handle data migration between versions with backward compatibility
- Avoid storing large binary data in plugin data files (use vault attachments instead)

**Rationale**: Obsidian's data management patterns ensure proper backup/restore, portability, and compatibility with Obsidian's synchronization features.

### III. TypeScript & Type Safety

TypeScript is mandatory with strict type checking enabled:
- Enable strict mode and all strict compiler options
- Use proper interfaces for plugin configuration and data structures
- Leverage Obsidian's type definitions from the plugin API
- Avoid `any` types except for specific cases with documented justification
- Use JSDoc comments for complex logic that benefits from inline documentation

**Rationale**: TypeScript catches errors at compile time, provides better IDE support, and documents the shape of data structures, reducing runtime errors in plugin environments.

### IV. Testing Strategy (NON-NEGOTIABLE)

Test-Driven Development is required for all new features:
- Write tests BEFORE implementing code (Red-Green-Refactor cycle)
- Test must FAIL initially, then pass after implementation
- Unit tests for business logic and data transformations
- Integration tests for Obsidian API interactions (use Obsidian's test utilities)
- Mock Obsidian's API in unit tests to isolate plugin logic
- Target minimum 80% code coverage for core functionality

**Rationale**: Testing prevents regressions, documents expected behavior, and provides confidence when updating for new Obsidian versions. Plugin environments are complex; tests catch issues early.

### V. User Experience & Error Handling

User-facing operations must be robust and provide clear feedback:
- Validate all user input before processing
- Show user-friendly error messages with actionable guidance
- Use Obsidian's notice system for non-critical user feedback
- Log technical errors to Obsidian's developer console
- Implement graceful degradation when features encounter errors
- Never expose stack traces to end users

**Rationale**: Plugins enhance user productivity; poor error handling frustrates users and obscures the root cause of issues. Clear feedback helps users succeed and aids debugging.

## Development Standards

### Code Quality

- Follow Obsidian plugin code style guidelines
- Use modern JavaScript/TypeScript features (ES6+, async/await)
- Maintain consistent naming conventions (camelCase for variables/functions, PascalCase for classes)
- Keep functions focused and under 50 lines when possible
- Document public APIs with clear usage examples

### Performance

- Optimize for Obsidian's performance constraints
- Use efficient data structures for note lookups and processing
- Implement caching for expensive operations with proper invalidation
- Avoid unnecessary file system reads; use Obsidian's cache when available
- Debounce user interactions to prevent excessive processing

### Versioning & Compatibility

- Follow semantic versioning (MAJOR.MINOR.PATCH)
- Document minimum Obsidian API version required
- Test against the latest Obsidian release and one previous version
- Provide migration guides for breaking changes
- Monitor Obsidian API changelog for deprecations

### Documentation

- Maintain a comprehensive README with installation and configuration instructions
- Document plugin settings with their defaults and effects
- Provide examples of common use cases
- Keep changelog updated with each release

## Governance

This constitution governs all development for the Note Buddy plugin. All contributors must:

1. **Comply with Core Principles**: Every PR must verify compliance with all five principles
2. **Follow Development Standards**: Code reviews enforce quality, performance, and documentation standards
3. **Maintain Test Coverage**: New features require tests; refactoring requires updating tests
4. **Document Changes**: Update README, changelog, and inline docs for all user-facing changes
5. **Respect Compatibility**: Breaking changes require MAJOR version bump and migration documentation

**Amendment Procedure**:
- Propose changes via GitHub issue with rationale and impact analysis
- Discuss and refine with the team
- Update constitution with incremented version following semantic versioning rules
- Update dependent templates to reflect changes
- Communicate changes to all contributors

**Compliance Review**:
- Code reviewers must check constitution compliance
- CI checks should validate test coverage and TypeScript compilation
- Release process includes constitution compliance verification

**Version**: 1.0.0 | **Ratified**: 2026-01-26 | **Last Amended**: 2026-01-26
