# Technology Stack

## Core Technologies

- **Shell**: Bash scripts for automation and workflow orchestration
- **Templating**: Markdown templates with placeholder substitution
- **Version Control**: Git-based feature branch workflow (optional, supports non-git repos)

## Project Type

This is a **specification and workflow management system** - not a traditional software application. It provides:
- Markdown templates for specifications, plans, and tasks
- Bash scripts for automation and setup
- AI agent prompts for guided workflows
- Directory structure conventions for organizing feature work

## Common Commands

### Feature Workflow

```bash
# Create new feature specification
/speckit.specify [feature description]

# Generate implementation plan
/speckit.plan [additional context]

# Create task breakdown
/speckit.tasks

# Implement tasks
/speckit.implement [task ID or description]
```

### Setup Scripts

```bash
# Create new feature branch and directory structure
.specify/scripts/bash/create-new-feature.sh --json "feature description" --number N --short-name "feature-name"

# Setup plan for existing feature
.specify/scripts/bash/setup-plan.sh --json

# Update agent context after planning
.specify/scripts/bash/update-agent-context.sh codex

# Check prerequisites
.specify/scripts/bash/check-prerequisites.sh
```

### Git Operations (when using git)

```bash
# Fetch all branches to check for existing features
git fetch --all --prune

# Find existing feature branches
git ls-remote --heads origin | grep -E 'refs/heads/[0-9]+-feature-name'
git branch | grep -E '^[* ]*[0-9]+-feature-name'
```

## Directory Structure Conventions

```
specs/[###-feature-name]/          # Feature-specific directory
├── spec.md                        # Requirements specification
├── plan.md                        # Implementation plan
├── tasks.md                       # Task breakdown
├── research.md                    # Technical research findings
├── data-model.md                  # Entity and data design
├── quickstart.md                  # Getting started guide
├── contracts/                     # API contracts (OpenAPI, GraphQL)
└── checklists/                    # Quality validation checklists
    └── requirements.md            # Spec quality checklist
```

## Environment Variables

- `SPECIFY_FEATURE`: Override feature detection (useful for non-git repos)
- Standard git environment variables when using git

## Script Conventions

- All scripts use `#!/usr/bin/env bash` for portability
- Common functions defined in `.specify/scripts/bash/common.sh`
- Scripts support both git and non-git repositories
- JSON output mode available with `--json` flag for machine parsing
