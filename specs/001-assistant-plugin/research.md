---
# Research: Note Buddy – Initial UI

**Feature**: Note Buddy – Initial UI  
**Date**: 2026-01-26  
**Purpose**: Record key technical decisions and why they were chosen.

---

## Plugin Architecture

**Decision**  
Use the standard Obsidian `Plugin` lifecycle (`onload`, `onunload`).

**Why**  
This is the only supported and stable entry point for Obsidian plugins. No abstraction or workaround is needed for this feature.

**Notes**
- View registration and ribbon setup happen in `onload`
- Cleanup is handled in `onunload`

---

## View Implementation

**Decision**  
Implement the chat panel as a custom `ItemView`.

**Why**  
`ItemView` is the intended abstraction for sidebar and leaf-based UI in Obsidian. It provides:
- Clear lifecycle hooks
- Proper workspace integration
- Automatic handling for desktop and mobile layouts

**Alternatives Rejected**
- `MarkdownView`: Too restrictive, enforces markdown rendering
- Manual `WorkspaceLeaf` handling: Unnecessary complexity

---

## Ribbon Entry Point

**Decision**  
Use `addRibbonIcon()` with the Lucide `bot` icon.

**Why**
- Ribbon is the most discoverable UI surface
- Lucide icons are built-in and theme-aware
- No need to manage custom SVG assets

---

## View Management (Duplicate Prevention)

**Decision**  
Ensure only one `note-buddy-chat` view exists at a time.

**Why**
- Multiple chat views provide no value at this stage
- Duplicate views create user confusion
- Preventing duplicates simplifies future state handling

**Approach**
- On activation, search existing workspace leaves
- Reveal existing view if found
- Create a new view only if none exists

---

## Layout & Theming

**Decision**  
Use flexbox layout and Obsidian CSS variables exclusively.

**Why**
- Flexbox is sufficient for vertical chat layout
- Obsidian CSS variables automatically support light/dark themes
- Avoids hardcoded colors and theme breakage

**Principle**
Theme state is derived from Obsidian, never stored.

---

## Testing Strategy (Initial Phase)

**Decision**  
Manual testing only for this feature.

**Why**
- UI behavior is simple and visually verifiable
- Automated tests add overhead without meaningful signal at this stage
- Tests will be introduced once logic becomes non-trivial (LLM, persistence)

---

## Tooling Choices

### TypeScript
- Strict mode enabled
- ES6+ target (Electron environment)

**Why**
- Matches Obsidian expectations
- Improves safety with minimal friction

### Package Manager
- Bun

**Why**
- Fast installs and builds
- Compatible with standard Node/Obsidian tooling
- Personal preference, low risk

---

## Summary of Key Decisions

| Area | Decision |
|-----|---------|
| Plugin base | `obsidian.Plugin` |
| Sidebar UI | `ItemView` |
| Entry point | Ribbon icon |
| Layout | Flexbox |
| Theming | Obsidian CSS variables |
| Duplicate views | Explicitly prevented |
| Testing (v0) | Manual |
| Package manager | Bun |

---

## Out of Scope (For This Feature)

- AI / OpenCode integration
- Message persistence
- Markdown rendering
- Settings and configuration UI

---

## Next Step

Implement the initial UI and activation logic as defined in the plan.
