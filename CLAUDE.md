# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Note Buddy is an Obsidian plugin that provides AI-powered assistance for notes. It integrates with an OpenCode service to enable chat-based interactions within Obsidian.

---
description: Use Bun instead of Node.js, npm, pnpm, or vite.
globs: "*.ts, *.tsx, *.html, *.css, *.js, *.jsx, package.json"
alwaysApply: false
---

## Runtime: Bun

Default to using Bun instead of Node.js.

- Use `bun <file>` instead of `node <file>` or `ts-node <file>`
- Use `bun test` instead of `jest` or `vitest`
- Use `bun build <file.html|file.ts|file.css>` instead of `webpack` or `esbuild`
- Use `bun install` instead of `npm install` or `yarn install` or `pnpm install`
- Use `bun run <script>` instead of `npm run <script>` or `yarn run <script>` or `pnpm run <script>`
- Use `bunx <package> <command>` instead of `npx <package> <command>`
- Bun automatically loads .env, so don't use dotenv.

## APIs

- `Bun.serve()` supports WebSockets, HTTPS, and routes. Don't use `express`.
- `bun:sqlite` for SQLite. Don't use `better-sqlite3`.
- `Bun.redis` for Redis. Don't use `ioredis`.
- `Bun.sql` for Postgres. Don't use `pg` or `postgres.js`.
- `WebSocket` is built-in. Don't use `ws`.
- Prefer `Bun.file` over `node:fs`'s readFile/writeFile
- Bun.$`ls` instead of execa.

## Testing

Use `bun test` to run tests.

```ts#index.test.ts
import { test, expect } from "bun:test";

test("hello world", () => {
  expect(1).toBe(1);
});
```

## Frontend

Use HTML imports with `Bun.serve()`. Don't use `vite`. HTML imports fully support React, CSS, Tailwind.

Server:

```ts#index.ts
import index from "./index.html"

Bun.serve({
  routes: {
    "/": index,
    "/api/users/:id": {
      GET: (req) => {
        return new Response(JSON.stringify({ id: req.params.id }));
      },
    },
  },
  // optional websocket support
  websocket: {
    open: (ws) => {
      ws.send("Hello, world!");
    },
    message: (ws, message) => {
      ws.send(message);
    },
    close: (ws) => {
      // handle close
    }
  },
  development: {
    hmr: true,
    console: true,
  }
})
```

HTML files can import .tsx, .jsx or .js files directly and Bun's bundler will transpile & bundle automatically. `<link>` tags can point to stylesheets and Bun's CSS bundler will bundle.

```html#index.html
<html>
  <body>
    <h1>Hello, world!</h1>
    <script type="module" src="./frontend.tsx"></script>
  </body>
</html>
```

With the following `frontend.tsx`:

```tsx#frontend.tsx
import React from "react";
import { createRoot } from "react-dom/client";

// import .css files directly and it works
import './index.css';

const root = createRoot(document.body);

export default function Frontend() {
  return <h1>Hello, world!</h1>;
}

root.render(<Frontend />);
```

Then, run index.ts

```sh
bun --hot ./index.ts
```

For more information, read the Bun API docs in `node_modules/bun-types/docs/**.mdx`.

---

## Build and Development Commands

### Development
```bash
bun run dev              # Watch mode with hot reload (uses esbuild.config.mjs)
bun run build            # Production build with type checking
```

### Testing
```bash
bun test                 # Run all tests (uses Vitest)
bun run test:ui          # Run tests with UI
bun run test:coverage    # Run tests with coverage report
```

### Installation to Obsidian
After building, copy the plugin to your Obsidian vault:
```bash
cp -r . ~/.obsidian/plugins/note-buddy/
```

## Architecture

### Core Components

**Plugin Entry Point** (`src/main.ts`)
- `NoteBuddyPlugin` class extends Obsidian's `Plugin`
- Manages plugin lifecycle (load/unload)
- Registers the chat view and ribbon icon
- Handles settings persistence via `loadSettings()` and `saveSettings()`

**Chat Interface** (`src/chat-view.ts`)
- `ChatView` class extends Obsidian's `ItemView`
- Renders chat UI with inline styles (no external CSS dependencies)
- Manages message state and session lifecycle
- Handles session recovery on 404 errors (creates new session and retries)

**OpenCode Client** (`src/service.ts`)
- `OpenCodeClient` class handles all API communication
- Implements model discovery with 5-minute cache (`MODELS_CACHE_TTL`)
- Session management with automatic creation
- 10-second request timeout for all API calls
- Model ID format: `providerID/modelID` (split on `/`)

**Settings UI** (`src/settings.ts`)
- `NoteBuddySettingTab` provides configuration interface
- Service URL validation (requires protocol, hostname, and port)
- Model discovery and selection with auto-select for single model
- Manual refresh button clears model cache

**Data Models** (`src/models.ts`)
- Type definitions for all API contracts
- Connection states, session states, message types
- Settings persistence structure

### Key Design Patterns

**Session Management**
- Sessions are created lazily on first message
- Stored in `plugin.sessionState` (in-memory, not persisted)
- Automatic recovery: if session returns 404, creates new session and retries once

**Model Configuration**
- Model IDs use format `providerID/modelID`
- Split on `/` before sending to API
- Falls back to server default if not configured

**Error Handling**
- All API calls wrapped in try-catch
- User-facing errors shown via Obsidian's `Notice`
- Console logging prefixed with `[NoteBuddy]`

## Build System

Uses ESBuild via `esbuild.config.mjs`:
- Entry point: `src/main.ts`
- Output: `main.js` (CommonJS format)
- Target: Node 18
- Externals: `obsidian`, `electron`, and all Node built-ins
- Development mode: watch + inline sourcemaps
- Production mode: single build, no sourcemaps

## Specification System

The project uses a structured specification system in `specs/`:
- Each feature has its own directory (e.g., `001-assistant-plugin`, `003-opencode-provider-config`)
- Standard files: `spec.md`, `plan.md`, `tasks.md`, `research.md`, `data-model.md`, `quickstart.md`
- Checklists in `checklists/requirements.md`

## Code Style

- TypeScript strict mode enabled
- Use camelCase for variables and functions
- Keep functions under 50 lines where practical
- Follow Obsidian plugin conventions
- Inline styles in chat view (uses CSS custom properties for theming)

## Important Notes

- The plugin uses Obsidian's `requestUrl` API for HTTP requests (not `fetch`)
- All API timeouts are 10 seconds
- Model cache TTL is 5 minutes
- Service URL must include protocol, hostname, and port
- Default service URL: `http://127.0.0.1:4096`

## Active Technologies
- TypeScript (ES2018+), Node 18+ + Obsidian API (^1.7.2), existing OpenCodeClient service (003-opencode-provider-config)
- Obsidian's data.json (plugin settings persistence) (003-opencode-provider-config)

## Recent Changes
- 003-opencode-provider-config: Added TypeScript (ES2018+), Node 18+ + Obsidian API (^1.7.2), existing OpenCodeClient service
