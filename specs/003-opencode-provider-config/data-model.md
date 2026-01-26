# Data Model: Model Selection via OpenCode Server

**Date**: 2026-01-26
**Feature**: specs/003-opencode-provider-config/spec.md

## Overview

The data model for model selection consists of two primary entities: Model Descriptor and Plugin Settings. The model supports up to 50 models per provider as established in clarifications.

## Entities

### Model Descriptor

Represents a model available from a provider through the OpenCode server.

**Fields**:
- `id: string` - Unique identifier for the model (e.g., "gpt-4", "llama3:latest")
- `object: string` - Always "model" for OpenAI compatibility
- `created: number` - Unix timestamp when model was added
- `owned_by: string` - Organization or provider name

**Validation Rules**:
- `id` must be non-empty string
- `id` must be unique across all models

**Relationships**:
- Referenced by Plugin Settings (defaultModelId)
- Retrieved from OpenCode server /v1/models endpoint
- Used in message requests to specify model selection

**Constraints**:
- Maximum 50 models supported total
- Models are read-only (discovered from server, not created locally)

### Plugin Settings

Stores user preferences for model selection in the Obsidian plugin.

**Fields**:
- `defaultModelId?: string` - Optional default model ID (e.g., "gpt-4")

**Validation Rules**:
- If present, must reference a valid model ID from discovered models
- Absence means no default selection (user chooses per request)

**Relationships**:
- References Model Descriptor id field
- Stored in Obsidian's data directory
- Persisted across plugin restarts

**Constraints**:
- Single default model per plugin instance
- Optional field (graceful degradation if unset)

## State Transitions

### Model Selection Flow
1. **Discovery**: Models fetched from OpenCode server
2. **Selection**: User chooses from available models
3. **Persistence**: Selection saved to plugin settings
4. **Usage**: Selected model included in AI requests
5. **Fallback**: If selected model unavailable, request proceeds without model specification

## Data Volume Considerations

- Expected: 10-50 models per provider (from clarification)
- Peak concurrent users: Single user (plugin instance)
- Storage impact: Minimal (<1KB for settings + cached model list)
- Network impact: Model discovery API call (under 5 seconds)