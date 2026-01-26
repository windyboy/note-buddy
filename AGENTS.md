# NoteBuddy Development Guidelines

Agentic coding guidelines for the NoteBuddy Obsidian plugin. Last updated: 2026-01-26

## Active Technologies
- **TypeScript 5.x**: Strict mode enabled, ESNext modules, ES6 target
- **Obsidian API**: Plugin framework with views, commands, and settings
- **Bun**: Runtime and bundler (not Node.js, npm, pnpm, or Vite)
- **Vitest**: Testing framework with coverage support
- **ESBuild**: Production bundling
- TypeScript 5.x + Obsidian API, Bun, Vites (003-opencode-provider-config)
- Obsidian data directory (plugin settings) (003-opencode-provider-config)

## Project Structure
```
src/
├── main.ts          # Plugin entry point
├── chat-view.ts     # Chat interface view
├── service.ts       # AI service client
├── models.ts        # TypeScript interfaces
└── settings.ts      # Settings UI

tests/
├── unit/            # Unit tests
├── integration/     # Integration tests
└── plugin.test.ts   # Plugin lifecycle tests
```

## Build Commands

### Development
```bash
bun run dev          # Start development build with hot reload
```

### Production Build
```bash
bun run build        # Type-check + production build
```

### Version Management
```bash
bun run version      # Bump version and update manifest
```

## Test Commands

### All Tests
```bash
bun test             # Run all tests once (CI mode)
bun run test         # Same as above
```

### Interactive Testing
```bash
bun run test:ui      # Run tests with web UI
```

### Coverage
```bash
bun run test:coverage  # Generate coverage report
```

### Single Test File
```bash
bun test tests/unit/ChatView.test.ts
bun test tests/unit/main.test.ts
bun test tests/integration/plugin-integration.test.ts
```

### Single Test Case
```bash
bun test --run --reporter=verbose tests/unit/main.test.ts -t "should load successfully"
```

## Code Style Guidelines

### TypeScript Configuration
- **Strict mode**: All strict checks enabled (`strict: true`)
- **Target**: ES6 with ESNext modules
- **Module resolution**: Node-style
- **Null checks**: `strictNullChecks: true`
- **No implicit any**: `noImplicitAny: true`

### Imports
```typescript
// External libraries first (alphabetical)
import { Plugin, WorkspaceLeaf } from 'obsidian';

// Local imports second (relative paths)
import { ChatView, VIEW_TYPE_CHAT } from './chat-view';
import { ServiceSettings, SessionState } from './models';
```

### Naming Conventions
- **Classes**: PascalCase (`NoteBuddyPlugin`, `ChatView`)
- **Methods**: camelCase (`activateView`, `loadSettings`)
- **Properties**: camelCase (`sessionState`, `ribbonIconEl`)
- **Constants**: UPPER_SNAKE_CASE (`VIEW_TYPE_CHAT`, `DEFAULT_SETTINGS`)
- **Files**: kebab-case (`chat-view.ts`, `service.ts`)
- **Test files**: Match source file name (`ChatView.test.ts`)

### Class Structure
```typescript
export default class NoteBuddyPlugin extends Plugin {
  // Public properties first
  settings!: ServiceSettings;
  sessionState?: SessionState;

  // Private properties second
  private ribbonIconEl: HTMLElement | null = null;

  // Lifecycle methods
  async onload() {
    // Implementation
  }

  onunload() {
    // Implementation
  }

  // Public methods
  async activateView() {
    // Implementation
  }

  // Private methods
  private async loadSettings() {
    // Implementation
  }
}
```

### Async/Await Patterns
```typescript
// Correct: Use async/await consistently
async onload() {
  await this.loadSettings();
  this.registerView(VIEW_TYPE_CHAT, (leaf) => new ChatView(leaf, this));
}

// Avoid: Mixing promises and async/await
onload() {
  return this.loadSettings().then(() => {
    this.registerView(/* ... */);
  });
}
```

### Error Handling
```typescript
// Service layer: Throw descriptive errors
async createSession(): Promise<SessionState> {
  try {
    const response = await this.request({ /* ... */ });
    if (response.status !== 200) {
      throw new Error(`HTTP ${response.status}: ${response.text}`);
    }
    return response.json;
  } catch (error) {
    const err = error as Error;
    throw new Error(`Failed to create session: ${err.message}`);
  }
}

// UI layer: Handle errors gracefully
try {
  const session = await this.client.createSession();
  // Success handling
} catch (error) {
  console.error('[NoteBuddy] Session creation failed:', error);
  new Notice(`Failed to create session: ${(error as Error).message}`);
}
```

### Testing Patterns

#### Test Structure
```typescript
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

describe("ComponentName", () => {
  let component: any;
  let mockDependency: any;

  beforeEach(() => {
    mockDependency = { method: vi.fn() };
    component = new Component(mockDependency);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("methodName", () => {
    it("should handle success case", async () => {
      // Arrange
      mockDependency.method.mockResolvedValue(expectedResult);

      // Act
      const result = await component.methodName();

      // Assert
      expect(result).toBe(expectedResult);
      expect(mockDependency.method).toHaveBeenCalledWith(expectedArgs);
    });

    it("should handle error case", async () => {
      // Arrange
      mockDependency.method.mockRejectedValue(new Error("test error"));

      // Act & Assert
      await expect(component.methodName()).rejects.toThrow("test error");
    });
  });
});
```

#### Mocking Strategy
```typescript
// Mock external dependencies
const mockWorkspace = {
  onLayoutReady: vi.fn((callback) => setTimeout(() => callback(), 0)),
  getLeavesOfType: vi.fn(() => []),
  setActiveLeaf: vi.fn().mockResolvedValue(undefined),
};

// Mock plugin methods
const mockPluginMethods = {
  onload: vi.fn().mockImplementation(async function(this: any) {
    // Mock implementation
  }),
  onunload: vi.fn(),
};
```

### Bun Usage (from .cursor/rules)
- Use `bun <command>` instead of `node`, `npm`, `pnpm`
- Use `bun test` instead of `jest` or `vitest` CLI
- Use `bun run <script>` instead of `npm run`
- Use `bunx <package>` instead of `npx`
- Bun automatically loads `.env` files (don't use `dotenv`)
- Prefer Bun APIs: `Bun.serve()`, `Bun.file()`, `Bun.sql()`, etc.

### Obsidian Plugin Patterns
- **Views**: Register with `registerView()` and unique string types
- **Commands**: Add with `addCommand()` including id and name
- **Settings**: Use `addSettingTab()` with custom setting tab class
- **Ribbon icons**: Add with `addRibbonIcon()` using icon names
- **Lifecycle**: `onload()` for setup, `onunload()` for cleanup

### Logging
```typescript
// Development logging: Use console methods
console.log('Loading NoteBuddy plugin...');
console.error('[NoteBuddy] Error:', error);

// Avoid: Custom logging libraries (keep it simple)
```

### File Organization
- **One class per file**: Main plugin class in `main.ts`
- **Related types together**: Models and interfaces in `models.ts`
- **Service separation**: API clients in separate files
- **Settings isolation**: UI settings in `settings.ts`

### Security Considerations
- **No secrets in code**: Never commit API keys or credentials
- **Input validation**: Validate all user inputs before processing
- **Error messages**: Don't expose internal system details in user-facing errors
- **HTTPS only**: Use HTTPS URLs for external services

### Performance
- **Lazy loading**: Load heavy dependencies only when needed
- **Efficient DOM**: Use Obsidian's DOM helpers (`createEl`, `createDiv`)
- **Memory management**: Clean up event listeners and DOM elements
- **Async operations**: Don't block the UI thread with synchronous operations

<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

## Recent Changes
- 003-opencode-provider-config: Added TypeScript 5.x + Obsidian API, Bun, Vites
