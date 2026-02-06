# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Obsidian plugin that connects to an OpenCode-compatible API server (default: `http://127.0.0.1:4096`) for AI-powered chat interactions.

## Commands

```bash
bun run dev      # Development with watch
bun run build    # Production build
bun test         # Run tests
bun vitest <file>  # Run specific test
```

## Architecture

### Core Flow
User input → `ChatView` → `OpenCodeClient` → OpenCode API → Response parts rendered by type

### Key Components
- `src/main.ts`: Plugin lifecycle, settings persistence, session state
- `src/chat-view.ts`: UI rendering, message history (`UiChatItem[]`), automatic session recovery
- `src/service.ts`: API client with 5-min model cache, automatic fallback to server default on model errors
- `src/settings.ts`: Service URL config, model selection dropdown (provider-grouped)
- `src/models.ts`: TypeScript contracts (source: `specs/003-opencode-provider-config/contracts/opencode-api.json`)

### OpenCode API
- `GET /global/health`: Health check
- `POST /session`: Create session
- `POST /session/{sessionID}/message`: Send message with optional `model: {providerID, modelID}`
- `GET /config/providers`: Model discovery (cached 5 min)

### State
**Persisted**: `serviceUrl`, `defaultModelId` (format: `providerId/modelId`)
**In-Memory**: `sessionState` (plugin), `messages` (ChatView), `cachedProviders` (OpenCodeClient)

## Key Design Decisions

**Model Selection**: `providerId/modelId` format, 5-min cache, automatic fallback to server default on errors

**Session Management**: Single session per plugin instance, auto-recovery on 404 (create new session and retry once)

**Part Rendering**: Switch on `part.type` to handle all OpenCode response types (text, reasoning, tool, patch, file, agent, etc.)

## Specification System

Features documented in `specs/<number>-<name>/` with standard artifacts: `spec.md`, `research.md`, `data-model.md`, `plan.md`, `tasks.md`, `quickstart.md`. Use `/speckit.*` commands for workflow automation.

## Branch Strategy

Main branch: `001-opencode-client`. Feature branches named after spec number (e.g., `003-opencode-provider-config`).

## Active Technologies
- TypeScript 5.9 + Obsidian API 1.11.4, esbuild (004-ui-enhancement)
- N/A (内存中的会话状态) (004-ui-enhancement)
- TypeScript 5.9 + Obsidian API 1.11.4, esbuild 0.27.2 (005-chat-page)
- Obsidian plugin data (JSON via plugin.saveData/loadData) (005-chat-page)
- Obsidian plugin data (JSON via plugin.saveData/loadData); plain local storage, no encryption (005-chat-page)

## Recent Changes
- 004-ui-enhancement: Added TypeScript 5.9 + Obsidian API 1.11.4, esbuild
