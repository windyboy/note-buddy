# Project Structure

## Root Directory Organization

```
.
├── .codex/                        # Codex AI agent prompts
│   └── prompts/                   # Command definitions for speckit workflow
├── .kiro/                         # Kiro AI configuration
│   └── steering/                  # AI guidance documents (this file)
├── .opencode/                     # OpenCode AI agent prompts
│   └── command/                   # Command definitions (mirrors .codex)
├── .specify/                      # SpecKit core system
│   ├── memory/                    # Project constitution and principles
│   ├── scripts/bash/              # Automation scripts
│   └── templates/                 # Markdown templates for specs/plans/tasks
└── specs/                         # Feature specifications (created per feature)
    └── [###-feature-name]/        # Individual feature directories
```

## Key Directories

### `.specify/` - Core System

**Purpose**: Contains the SpecKit workflow system itself

- `memory/constitution.md`: Project-specific development principles and constraints
- `scripts/bash/`: Automation scripts for feature creation, planning, and context management
- `templates/`: Markdown templates that define the structure of specs, plans, and tasks

### `.codex/` and `.opencode/` - AI Agent Integration

**Purpose**: AI agent command definitions for different platforms

- Both directories contain identical workflow commands
- `.codex/` for Codex AI agents
- `.opencode/` for OpenCode AI agents
- Commands: specify, plan, tasks, implement, clarify, analyze, checklist, constitution

### `specs/` - Feature Work

**Purpose**: Contains all feature specifications and implementation artifacts

**Naming Convention**: `###-feature-name` where:

- `###` is a zero-padded 3-digit number (001, 002, 003...)
- `feature-name` is a kebab-case short name (2-4 words)
- Examples: `001-user-auth`, `042-payment-integration`

**Feature Directory Structure**:
```
specs/###-feature-name/
├── spec.md                        # Requirements (WHAT and WHY)
├── plan.md                        # Technical plan (HOW)
├── tasks.md                       # Implementation tasks
├── research.md                    # Technical research findings
├── data-model.md                  # Entity and relationship design
├── quickstart.md                  # Getting started guide
├── contracts/                     # API contracts
│   ├── openapi.yaml              # REST API specs
│   └── schema.graphql            # GraphQL schemas
└── checklists/                    # Quality validation
    └── requirements.md            # Spec completeness checklist
```

## File Naming Conventions

### Feature Branches (when using git)

Format: `###-feature-name`
- Must start with 3-digit number
- Followed by hyphen and kebab-case name
- Multiple branches can share the same number prefix (e.g., `004-fix-bug`, `004-add-feature`)

### Specification Files

- `spec.md`: Feature specification (requirements, user stories, acceptance criteria)
- `plan.md`: Implementation plan (technical context, architecture, phases)
- `tasks.md`: Task breakdown (organized by user story with dependencies)
- `research.md`: Technical research (decisions, rationale, alternatives)
- `data-model.md`: Data design (entities, fields, relationships, validation)
- `quickstart.md`: Getting started guide (setup, usage, examples)

### Template Files

All templates use `.md` extension and follow this pattern:

- `[artifact]-template.md`: Template for creating that artifact type
- Templates contain placeholders in `[BRACKETS]` or `$VARIABLES`
- Section markers like `<!--ACTION REQUIRED-->` indicate areas needing customization

## Path Resolution

### Git Repositories

- Repository root: `git rev-parse --show-toplevel`
- Current branch: `git rev-parse --abbrev-ref HEAD`
- Feature lookup: Match numeric prefix across branches and specs directories

### Non-Git Repositories

- Repository root: Script location fallback (`.specify/scripts/bash/../../..`)
- Current branch: Latest feature directory or `$SPECIFY_FEATURE` environment variable
- Feature lookup: Scan `specs/` directory for matching numeric prefix

## Organization Principles

1. **Separation of Concerns**: System files (`.specify/`) separate from feature work (`specs/`)
2. **Feature Isolation**: Each feature gets its own numbered directory
3. **Template-Driven**: All artifacts follow consistent template structure
4. **Multi-Agent Support**: Identical commands available for different AI platforms
5. **Git-Optional**: System works with or without git version control
