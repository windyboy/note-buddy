# Note Buddy Plugin

## Development

- Build the plugin before committing:
  ```bash
  bun run build
  ```

## Testing

- All tests must pass before committing:
  ```bash
  bun test
  ```

## Code Style

- Use TypeScript strict mode
- Follow Obsidian plugin conventions
- Write tests first (TDD approach)
- Keep functions under 50 lines
- Use camelCase for variables and functions

## Dependencies

- TypeScript 5.x
- Obsidian API
- Vitest for testing
- ESBuild for bundling

## Notes

- This plugin uses the standard Obsidian plugin structure
- All source files are in `src/`
- Tests are in `tests/`
- Styles are in `src/styles.css`
