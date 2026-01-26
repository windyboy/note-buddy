# Quick Start Guide: Note Buddy – Initial UI

**Feature**: Note Buddy – Initial UI | **Date**: 2026-01-26

## Installation

### 1. Clone or Download

Download the plugin distribution:
```bash
# From dist directory after build
unzip note-buddy-1.0.0.zip -d ~/.obsidian/plugins/note-buddy
```

### 2. Install Dependencies

```bash
# Using Bun (recommended)
bun install

# Or using npm
npm install
```

### 3. Enable in Obsidian

1. Open Obsidian
2. Go to **Settings → Community Plugins**
3. Turn on **Community plugins**
4. Click **Browse** and search for "Note Buddy"
5. Click **Install** and **Enable**

Or for manual installation:
```bash
# Copy plugin directory to Obsidian plugins folder
cp -r note-buddy ~/.obsidian/plugins/
# Enable in Settings → Community Plugins
```

### 4. Verify Installation

After enabling, you should see a bot icon (🤖) in the left ribbon.

---

## Usage

### Opening the Chat View

1. Click the **bot icon** in the left ribbon
2. The Note Buddy chat view opens in the right sidebar
3. If already open, the view is brought to focus (no duplicates)

### Understanding the UI

The chat view displays:
- **Header**: "Note Buddy" title with bot icon
- **Message Area**: Empty placeholder (messages not implemented yet)
- **Input Area**: Text input field with send button icon

### Theme Support

The view automatically adapts to Obsidian's theme:
- **Light mode**: Uses white/gray colors
- **Dark mode**: Uses dark colors
- **Custom themes**: Respects user theme colors via CSS variables

### Closing the View

- Click the **X** in the view header to close
- Or click the ribbon icon to toggle open/close
- View state persists across Obsidian restarts

---

## Development

### Prerequisites

```bash
bun --version  # Bun 1.0+
# OR
node -v  # Node.js 18+
npm -v   # npm 9+
```

### Setup

```bash
# Install dependencies
bun install

# Run in development mode
bun run dev

# Build for production
bun run build
```

### Testing

```bash
# Run tests
bun run test

# Run tests with UI
bun run test:ui

# Run tests with coverage
bun run test:coverage
```

### Development Workflow

1. Make changes to `src/main.ts` or `src/views/ChatView.ts`
2. Development server watches and hot-reloads
3. Run tests to verify changes
4. Build before committing

---

## Troubleshooting

### Plugin Won't Enable

**Symptom**: Plugin shows in list but can't enable

**Solutions**:
- Check Obsidian console: `Ctrl+Shift+I` → Console tab
- Verify Node.js version compatibility
- Check manifest.json minAppVersion matches your Obsidian version

### Chat View Won't Open

**Symptom**: Clicking ribbon icon does nothing

**Solutions**:
- Check Obsidian console for errors
- Verify view type is registered: "note-buddy-chat"
- Try reloading Obsidian: `Ctrl+R`

### Styling Issues

**Symptom**: Colors look wrong in dark mode

**Solutions**:
- Ensure styles.css uses CSS variables, not hardcoded colors
- Check that CSS variables are defined in the correct scope
- Try switching themes to test responsiveness

### Test Failures

**Symptom**: Tests fail after changes

**Solutions**:
```bash
# Run tests with verbose output
bun run test -- --verbose

# Run specific test file
bun run test -- ChatView.test.ts

# Clear cache and retry
rm -rf node_modules/.vitest
bun run test
```

---

## Limitations (Initial Feature)

This initial version has intentional limitations:
- No actual LLM integration
- No message persistence
- No user settings/configuration
- No API key management
- No chat history
- Empty message area (no real messages)

These will be added in subsequent features.

---

## Next Steps

After familiarizing with the initial UI:
1. Review the implementation plan: `plan.md`
2. Explore the data model: `data-model.md`
3. Check test coverage: `vitest run --coverage`
4. Ready for LLM integration planning (future feature)

---

## Support

For issues or questions:
- Check Obsidian console for error messages
- Review test files for usage examples
- See Obsidian Plugin API docs: https://docs.obsidian.md/Plugins/User+interface/Plugin+API
