# Data Model: Model Selection via OpenCode Server

**Date**: 2026-01-28 (Updated)
**Feature**: specs/003-opencode-provider-config/spec.md

## Overview

The data model for model selection uses a provider-based hierarchy. The OpenCode server exposes providers, each containing multiple models. The plugin stores a selected model as a `{ providerID, modelID }` pair. The model supports up to 50 models per provider as established in clarifications.

## Entities

### Provider

Represents an AI provider (e.g., Anthropic, OpenAI) exposed by the OpenCode server.

**Fields**:
- `id: string` - Unique provider identifier (e.g., "anthropic", "openai")
- `name: string` - Human-readable provider name (e.g., "Anthropic", "OpenAI")
- `models: Model[]` - Array of models available from this provider

**Validation Rules**:
- `id` must be non-empty string
- `id` must be unique across all providers
- `name` must be non-empty string
- `models` array can be empty (provider with no models)

**Relationships**:
- Contains multiple Model entities
- Retrieved from OpenCode server `/v1/capabilities` endpoint

**Constraints**:
- Providers are read-only (discovered from server, not created locally)
- Maximum 50 models per provider

---

### Model

Represents a specific AI model available from a provider.

**Fields**:
- `id: string` - Unique model identifier within provider (e.g., "claude-3-5-sonnet-20241022")
- `name: string` - Human-readable model name (e.g., "Claude 3.5 Sonnet")

**Validation Rules**:
- `id` must be non-empty string
- `id` must be unique within provider
- `name` must be non-empty string

**Relationships**:
- Belongs to a Provider entity
- Referenced by Plugin Settings (defaultModel)

**Constraints**:
- Models are read-only (discovered from server, not created locally)
- Model ID is scoped to provider (same ID can exist across different providers)

---

### ModelSelection

Represents a user's selected model, combining provider and model identifiers.

**Fields**:
- `providerID: string` - Provider identifier (e.g., "anthropic")
- `modelID: string` - Model identifier (e.g., "claude-3-5-sonnet-20241022")

**Validation Rules**:
- `providerID` must be non-empty string
- `modelID` must be non-empty string
- Both fields required if ModelSelection is present

**Relationships**:
- References a Provider by `providerID`
- References a Model by `modelID` within that provider
- Stored in Plugin Settings

**Constraints**:
- Must reference valid provider and model from discovered capabilities
- Used in message payloads to OpenCode API

---

### Plugin Settings

Stores user preferences for the NoteBuddy plugin, including optional model selection.

**Fields**:
- `serviceUrl: string` - OpenCode server URL (existing field)
- `defaultModel?: ModelSelection` - Optional selected model

**Validation Rules**:
- `serviceUrl` must be valid URL with protocol, hostname, and port
- `defaultModel` is optional (undefined means use server default)
- If `defaultModel` is present, must contain valid `providerID` and `modelID`

**Relationships**:
- References ModelSelection entity (optional)
- Stored in Obsidian's data.json file
- Persisted across plugin restarts

**Constraints**:
- Single default model per plugin instance
- Optional field enables graceful degradation


## State Transitions

### Model Discovery Flow

1. **Initial State**: No models cached, `modelsCache.data = null`
2. **Discovery Triggered**: User clicks "Refresh Models" button
3. **Loading State**: Loading indicator shown, API call to `/v1/capabilities`
4. **Success State**: Providers and models cached with timestamp
5. **Cache Valid**: Subsequent requests use cached data (5-minute TTL)
6. **Cache Expired**: After 5 minutes, cache invalidated, requires new discovery

### Model Selection Flow

1. **No Selection**: `defaultModel` is undefined, server uses default
2. **User Selects**: User chooses model from dropdown
3. **Persisted**: `defaultModel` saved to Obsidian data.json
4. **In Use**: Model included in message payloads as `{ providerID, modelID }`
5. **Model Unavailable**: Fallback to server default, show notification
6. **User Changes**: New selection overwrites previous, immediately persisted

## Data Volume Considerations

- **Expected**: 10-50 models per provider (from clarification)
- **Peak concurrent users**: Single user (plugin instance)
- **Storage impact**: Minimal (<1KB for settings + cached model list)
- **Network impact**: Model discovery API call (under 5 seconds per spec)
- **Cache size**: ~5-10KB for 50 models with metadata
- **Memory footprint**: Negligible for single-user desktop application

---

## TypeScript Type Definitions

```typescript
// Provider entity
interface Provider {
  id: string;
  name: string;
  models: Model[];
}

// Model entity
interface Model {
  id: string;
  name: string;
}

// Model selection entity
interface ModelSelection {
  providerID: string;
  modelID: string;
}

// Plugin settings entity
interface NoteBuddySettings {
  serviceUrl: string;
  defaultModel?: ModelSelection;
}

// API response from /v1/capabilities
interface CapabilitiesResponse {
  providers: Provider[];
}
```

---

## API Contract References

See `contracts/opencode-api.yaml` for complete OpenAPI specification of the `/v1/capabilities` endpoint.