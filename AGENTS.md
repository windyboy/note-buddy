# Repository Guidelines

## Project Structure & Module Organization
- Core plugin code lives in `src/`.
- Entry point is `src/main.ts`; chat UI logic is in `src/views/ChatView.ts`; service/model/settings logic is in files like `src/service.ts`, `src/models.ts`, and `src/settings.ts`.
- Automated tests live in `tests/` with `unit/`, `integration/`, and `mocks/` (including the Obsidian API stub at `tests/mocks/obsidian.ts`).
- Build/runtime artifacts include `main.js`, `main.css`, and `manifest.json` at the repository root.
- Feature specs and implementation notes are in `specs/`.

## Build, Test, and Development Commands
- `bun install`: install dependencies.
- `bun run dev`: run esbuild in development mode for fast rebuilds.
- `bun run build`: type-check (`tsc`) and produce production bundle.
- `bun test`: run all Vitest tests once (`vitest --run`).
- `bun run test:ui`: open Vitest UI for interactive debugging.
- `bun run test:coverage`: generate coverage reports (`text`, `html`, `json`).

## Coding Style & Naming Conventions
- Language: TypeScript with strict mode (`strict`, `noImplicitAny`, `strictNullChecks`).
- Use tabs/indentation consistent with existing `src/` and `tests/` files.
- Prefer `camelCase` for variables/functions and `PascalCase` for classes/types/views (for example, `ChatView`).
- Keep functions focused and small; split complex flows into helpers.
- Follow existing Obsidian plugin patterns; avoid introducing new frameworks.

## Testing Guidelines
- Framework: Vitest (`tests/**/*.test.ts`).
- Place fast logic tests in `tests/unit/`; cross-module behavior in `tests/integration/`.
- Name test files as `<feature>.test.ts` (example: `service.test.ts`).
- Run `bun test` before every commit; run coverage checks for significant changes.

## Commit & Pull Request Guidelines
- Use imperative, concise commit subjects (example: `Add model refresh error handling`).
- Keep commits scoped to one logical change.
- PRs should include: purpose, key changes, test evidence (`bun test` output), and screenshots/GIFs for UI updates.
- Link related spec/issue documents when applicable (for example, files in `specs/`).

## Security & Configuration Tips
- Do not commit API keys, vault-specific paths, or local secrets.
- Validate `manifest.json` and bundled outputs after version/build changes.
