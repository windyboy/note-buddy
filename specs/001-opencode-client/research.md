# Research: Opencode Client

**Feature**: Opencode Client Interface | **Date**: 2025-01-21

---

## Technology Choices

### Obsidian Plugin Architecture

- Use standard Obsidian plugin API with TypeScript
- Extend `Plugin` base class
- Use `PluginSettingTab` for configuration
- Store data via `saveData`/`loadData`
- Integrate UI via `WorkspaceLeaf`

### TypeScript Configuration

- TypeScript 5.6+ with strict mode
- No `any`, no `allowJs`
- ES2022 target
- Obsidian types

### HTTP Client: Ky

- Modern Fetch-based HTTP client
- Built-in retry with exponential backoff
- Timeout handling
- TypeScript-first design
- Small bundle size (~3KB)

### Vault Access: Obsidian Vault API

- Use `app.vault.getMarkdownFiles()`
- Handle encoding automatically
- File watching via Obsidian

### Session Management

- In-memory cache for active sessions
- Persistence via plugin data API
- Debounced saves to reduce I/O

### Chat UI: WorkspaceLeaf

- Native Obsidian UI integration
- Dockable panel
- Respects theming

### Testing: Vitest

- Fast, ESM-first
- TypeScript support
- Mock Obsidian APIs

---

## Performance Optimization

- Debounce state writes (500ms)
- Stream vault indexing with progress callbacks
- In-memory session cache
- Lazy note loading

---

## Error Handling

- Custom OpencodeError class
- User-friendly messages
- Obsidian logging for debug
- Graceful degradation

---

## Security

- Validate all user input
- HTTPS-only server URLs
- Sanitize vault content
- No data exfiltration without consent

---

## Implementation Notes

Use TypeScript strict mode throughout. Keep dependencies minimal. Focus on P1 features first.
