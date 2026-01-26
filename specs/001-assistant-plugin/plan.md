# Implementation Plan: Note Buddy – Initial UI (Refined)

**Branch**: `001-assistant-plugin`  
**Date**: 2026-01-26  
**Spec**: `specs/001-assistant-plugin/spec.md`  
**Goal**: Minimal Obsidian plugin that opens/focuses a single ChatView from a ribbon icon.


## Scope (What we are building)

- Plugin scaffold that loads cleanly in Obsidian
- One sidebar view: `note-buddy-chat`
- Ribbon icon (Lucide: `bot`) to open or focus the view
- Simple chat layout: header, scroll area, textarea + Send button
- “Send” logs to console and clears input
- No persistence, no settings, no LLM integration

---

## Non-Goals (Explicitly not doing)

- Streaming, markdown rendering, message history
- Data storage / files / settings UI
- Automated test harness beyond basic lint/typecheck (optional)

---

## Technical Choices (Keep it boring)

- **Language**: TypeScript
- **Build**: standard Obsidian plugin build (esbuild)
- **Package manager**: Bun (fine)
- **Styling**: use Obsidian CSS variables + minimal plugin CSS

---

## Project Structure (Minimal, readable)

```text
specs/001-assistant-plugin/
  spec.md
  plan.md
  data-model.md

src/
  main.ts
  views/
    ChatView.ts
  styles.css

manifest.json
package.json
tsconfig.json
esbuild.config.mjs
