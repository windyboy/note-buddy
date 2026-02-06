# Note Buddy

## Project Overview

Note Buddy is an Obsidian plugin that acts as an AI-powered assistant for your notes. It provides a chat interface within Obsidian to interact with your vault content.

### Key Technologies
*   **Language:** TypeScript
*   **Runtime/Package Manager:** Bun
*   **Bundler:** esbuild
*   **Testing:** Vitest
*   **Framework:** Obsidian Plugin API

### Architecture
*   **Entry Point:** `src/main.ts` - Manages plugin lifecycle, state, and commands.
*   **Views:** `src/views/ChatView.ts` - Handles the UI for the chat interface.
*   **State Management:** `src/models.ts` defines the data structures (`PluginData`, `ChatSession`, `ChatMessage`). State is persisted using Obsidian's `loadData()`/`saveData()`.
*   **Settings:** `src/settings.ts` - Configures plugin preferences.

## Building and Running

### Prerequisites
*   [Bun](https://bun.sh/) installed.

### Commands

| Action | Command | Description |
| :--- | :--- | :--- |
| **Install Dependencies** | `bun install` | Installs project dependencies. |
| **Development Build** | `bun run dev` | Builds the plugin in watch mode. |
| **Production Build** | `bun run build` | Creates a minified production build. |
| **Run Tests** | `bun test` | Runs unit tests using Vitest. |
| **Test UI** | `bun run test:ui` | Opens the Vitest UI. |
| **Test Coverage** | `bun run test:coverage` | Generates a test coverage report. |
| **Version Bump** | `bun run version` | Bumps version in `manifest.json` and `versions.json`. |

## Development Conventions

### Code Style
*   **Formatting:** Follows standard TypeScript/JavaScript conventions.
*   **Imports:** Uses ES modules. Styles are imported directly (`import './styles.css'`).

### Testing
*   **Framework:** Vitest is used for testing.
*   **Mocks:** The Obsidian API is mocked in `tests/mocks/obsidian.ts` to allow testing without a running Obsidian instance.
*   **Configuration:** See `vitest.config.ts`.
*   **Location:** Tests are located in the `tests/` directory.

### Obsidian Specifics
*   **Manifest:** `manifest.json` contains metadata like ID, version, and description.
*   **Hot Reloading:** For development, you typically symlink or copy the build output (`main.js`, `manifest.json`, `styles.css`) to your Obsidian vault's `.obsidian/plugins/note-buddy/` directory.

### File Structure
*   `src/` - Source code.
*   `tests/` - Unit and integration tests.
*   `types/` - TypeScript type definitions (e.g., `obsidian.d.ts`).
