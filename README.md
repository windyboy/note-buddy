# Note Buddy

AI-powered assistant for your notes.

## Setup

1. Install dependencies:
   ```bash
   bun install
   ```

2. Run in development mode:
   ```bash
   bun run dev
   ```

3. Build for production:
   ```bash
   bun run build
   ```

## Testing

Run tests:
```bash
bun test
```

Run tests with UI:
```bash
bun run test:ui
```

Run tests with coverage:
```bash
bun run test:coverage
```

## Installation

1. Build the plugin:
   ```bash
   bun run build
   ```

2. Copy the built files to your Obsidian vault:
   ```bash
   cp -r . ~/.obsidian/plugins/note-buddy/
   ```

3. Enable the plugin in Obsidian Settings → Community Plugins.

## Development

- `src/main.ts` - Plugin entry point
- `src/views/ChatView.ts` - Chat view component
- `src/styles.css` - Plugin styles

## License

MIT
