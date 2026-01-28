# Research Findings: Model Selection via OpenCode Server

**Date**: 2026-01-28 (Updated)
**Feature**: specs/003-opencode-provider-config/spec.md
**Status**: Complete

## Overview

This document captures research findings and technical decisions for implementing model discovery and selection in the NoteBuddy plugin. Research focused on OpenCode API patterns, caching strategies, UI/UX patterns, error handling, and integration with existing plugin architecture.

## Technical Context Assessment

All aspects of the technical context were resolved from:
- Project constitution (.specify/memory/constitution.md)
- CLAUDE.md guidelines for NoteBuddy plugin
- Feature specification clarifications
- Existing codebase patterns (service.ts, settings.ts, models.ts)

No NEEDS CLARIFICATION markers remained in the technical context.

---

## Research Areas

### 1. OpenCode API Model Discovery Endpoint

**Question**: What endpoint and format does OpenCode use for model discovery?

**Decision**: Use `/v1/capabilities` endpoint

**Rationale**:
- Standard OpenCode API v1.0 pattern for server capability discovery
- Returns structured data about available providers and models
- Aligns with existing OpenCodeClient implementation patterns

**Expected Response Format**:
```json
{
  "providers": [
    {
      "id": "anthropic",
      "name": "Anthropic",
      "models": [
        {
          "id": "claude-3-5-sonnet-20241022",
          "name": "Claude 3.5 Sonnet"
        }
      ]
    }
  ]
}
```

**Alternatives Considered**:
- `/v1/models` - Too generic, doesn't capture provider hierarchy
- `/v1/providers` - Doesn't include model information

---

### 2. Model Caching Strategy

**Question**: How should we cache discovered models to balance freshness with performance?

**Decision**: 5-minute in-memory cache with manual refresh

**Rationale**:
- Aligns with existing `MODELS_CACHE_TTL` constant in service.ts
- Manual refresh gives users control over when to check for new models
- 5 minutes is sufficient for typical usage sessions
- Prevents excessive API calls during settings UI interactions

**Implementation Pattern**:
```typescript
private modelsCache: {
  data: Provider[] | null;
  timestamp: number;
} = { data: null, timestamp: 0 };

private isCacheValid(): boolean {
  return Date.now() - this.modelsCache.timestamp < MODELS_CACHE_TTL;
}
```

**Alternatives Considered**:
- Automatic refresh on settings open - Too aggressive, unnecessary API calls
- No caching - Poor performance, excessive server load
- Persistent cache - Stale data across restarts, complexity not justified

---

### 3. Settings UI Pattern for Model Selection

**Question**: How should the model selection UI be structured in Obsidian settings?

**Decision**: Dropdown with grouped options by provider

**Rationale**:
- Native Obsidian dropdown component (`addDropdown`)
- Supports grouping via option labels (e.g., "Anthropic / Claude 3.5 Sonnet")
- Familiar pattern for Obsidian users
- Handles single model auto-select naturally

**UI Flow**:
1. "Refresh Models" button with loading indicator
2. Dropdown populated with `providerID/modelID` format
3. Display format: "Provider Name / Model Name"
4. Store format: `{ providerID, modelID }`

**Alternatives Considered**:
- Two-level dropdown (provider then model) - Over-engineered for typical use
- Radio buttons - Poor scalability for 50+ models
- Custom modal - Unnecessary complexity

---

### 4. Error Handling Patterns

**Question**: How should we handle various failure scenarios gracefully?

**Decision**: Layered error handling with user-friendly messages

**Rationale**:
- Consistent with existing NoteBuddy error handling patterns
- Uses Obsidian's `Notice` for non-blocking notifications
- Console logging with `[NoteBuddy]` prefix for debugging

**Error Scenarios**:

| Scenario | Handling | User Message |
|----------|----------|--------------|
| Server unreachable | Catch network error | "Cannot connect to OpenCode server. Check service URL." |
| Empty model list | Check response | "No models available. Check OpenCode configuration." |
| Selected model unavailable | Fallback to default | "Previously selected model unavailable. Using server default." |
| API timeout | 10-second timeout | "Model discovery timed out. Try again." |

**Alternatives Considered**:
- Silent failures - Poor user experience
- Blocking error modals - Too intrusive for non-critical errors

---

### 5. Model Persistence Format

**Question**: How should selected model be stored in plugin settings?

**Decision**: Optional object with providerID and modelID

**Rationale**:
- Matches OpenCode API message format requirements
- Optional field allows "no selection" state (use server default)
- Simple serialization to Obsidian's data.json
- Type-safe with TypeScript interfaces

**Settings Schema**:
```typescript
interface NoteBuddySettings {
  serviceUrl: string;
  defaultModel?: {
    providerID: string;
    modelID: string;
  };
}
```

**Alternatives Considered**:
- Single string "providerID/modelID" - Requires parsing, error-prone
- Separate fields - Redundant structure
- Array of models - Over-engineered for single selection

---

### 6. Message Payload Integration

**Question**: How should selected model be included in chat messages?

**Decision**: Add optional model field to message payload, best-effort basis

**Rationale**:
- OpenCode API accepts optional model override in message
- Graceful degradation if server ignores field
- No breaking changes to existing message flow

**Implementation Pattern**:
```typescript
const payload: any = {
  role: "user",
  content: message
};

if (this.plugin.settings.defaultModel) {
  payload.providerID = this.plugin.settings.defaultModel.providerID;
  payload.modelID = this.plugin.settings.defaultModel.modelID;
}
```

**Alternatives Considered**:
- Session-level model configuration - Requires session recreation on model change
- Separate model selection API call - Unnecessary complexity

---

### 7. Loading State UX

**Question**: How should loading state be communicated during model discovery?

**Decision**: Inline loading indicator next to refresh button, non-blocking

**Rationale**:
- Keeps settings UI accessible during discovery
- Clear visual feedback without modal overlay
- Consistent with modern web UX patterns

**Implementation**:
- Show spinner icon next to "Refresh Models" button
- Disable button during loading
- Keep dropdown and other settings interactive
- Clear indicator on completion or error

**Alternatives Considered**:
- Full-screen loading overlay - Too intrusive
- No loading indicator - Poor feedback
- Disable entire settings tab - Unnecessarily restrictive

---

## Technology Stack Decisions

### Testing Approach

**Decision**: Vitest with mocked Obsidian API

**Rationale**:
- Already configured in project (bun test)
- Fast execution with Bun runtime
- Good TypeScript support
- Easy mocking of Obsidian requestUrl

**Test Coverage**:
- Unit tests for model discovery logic
- Settings persistence tests
- Error handling scenarios
- Cache invalidation logic

---

### TypeScript Patterns

**Decision**: Strict type safety with interfaces for all API contracts

**Rationale**:
- Project uses strict TypeScript mode
- Prevents runtime errors from API changes
- Self-documenting code
- Better IDE support

**Key Interfaces**:
```typescript
interface Provider {
  id: string;
  name: string;
  models: Model[];
}

interface Model {
  id: string;
  name: string;
}

interface ModelSelection {
  providerID: string;
  modelID: string;
}
```

---

## Performance Considerations

### Model Discovery Performance

**Target**: <5 seconds (per spec SC-005)

**Approach**:
- Single API call to `/v1/capabilities`
- 10-second timeout (existing constant)
- In-memory caching (5-minute TTL)
- Async/await pattern with proper error handling

**Monitoring**:
- Console timing logs for discovery duration
- User-visible timeout errors if >10 seconds

---

### UI Responsiveness

**Target**: <100ms for UI updates

**Approach**:
- Async model discovery doesn't block UI thread
- Dropdown population is synchronous (fast with <50 models)
- Loading indicator updates immediately
- Settings save is synchronous (Obsidian API)

---

## Security Considerations

### No Credential Storage

**Decision**: Plugin does NOT store provider API keys

**Rationale**:
- OpenCode server manages all provider credentials
- Plugin only stores model selection preferences
- Reduces security surface area
- Aligns with spec FR-009

### API Communication

**Decision**: Use existing OpenCodeClient with requestUrl

**Rationale**:
- Obsidian's requestUrl API (not fetch)
- Existing 10-second timeout protection
- Consistent error handling patterns
- No new security concerns introduced

---

## Open Questions

None. All technical decisions documented above.

---

## References

- OpenCode API v1.0 specification
- Obsidian Plugin API documentation
- Existing NoteBuddy implementation (main.ts, service.ts, settings.ts)
- Feature specification: specs/003-opencode-provider-config/spec.md