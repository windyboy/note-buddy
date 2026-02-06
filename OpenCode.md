# OpenCode.md

## Commands

### Development
- Start development with hot-reloading: `bun run dev`
- Build for production: `bun run build`

### Testing
- Run all tests: `bun test`
- Run a specific test file: `bun vitest <file>`

## Code Style

### General Guidelines
- Follow TypeScript best practices.
- Write clean and modular code. Break complex logic into smaller functions.

### Naming Conventions
- Use `camelCase` for variables and functions.
- Use `PascalCase` for classes and TypeScript interfaces.
- Constants should be `UPPER_SNAKE_CASE`.

### Imports and Formatting
- Group imports into libraries, internal modules, and relative paths.
- Use consistent ordering and avoid wildcard imports.
- Indentation: 2 spaces.
- Use single quotes for strings.

### Types and Interfaces
- Prefer `interface` over `type` unless using advanced type constructs.
- Annotate function return types explicitly.
- Use `unknown` instead of `any` where the type is not certain.

### Error Handling
- Handle errors gracefully using `try...catch` blocks.
- Log meaningful error messages. Avoid generic `console.log()`.

### Testing
- Write unit tests for functions with critical business logic.
- Use clear and descriptive test case names.

---
For additional details, refer to `CLAUDE.md` or `.cursor/rules` in the repository.