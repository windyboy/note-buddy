# Implementation Plan: Model Selection via OpenCode Server

**Branch**: `003-opencode-provider-config`  
**Spec**: `specs/003-opencode-provider-config/spec.md`

## Goal

Extend the NoteBuddy plugin with **model selection support** by:
1. Discovering available providers and models from a local OpenCode server
2. Allowing the user to select a default model
3. Sending messages with the selected model on a best-effort basis

This plan intentionally stops at **single default model selection** and **does not manage providers or credentials**.

---

## Explicit Non-Goals (Stop Conditions)

This plan does NOT include:
- Provider configuration or API key management
- Streaming responses
- Model capability comparison or ranking
- Caching or pagination of model lists
- Guarantees that the server will honor model selection

Any of the above requires a new feature spec.

---

## Implementation Phases

### Phase 1 — Model Discovery

**Objective**: Load available providers and models from the OpenCode server.

Steps:
1. Add a client method to call the server model discovery endpoint
2. Parse provider/model identifiers into simple descriptors
3. Handle unsupported or missing endpoint gracefully

**Done when**:
- Models load when supported
- Clear message shown when unsupported or unreachable

---

### Phase 2 — Settings UI Integration

**Objective**: Allow the user to select a default model in settings.

Steps:
1. Add settings UI with a dropdown populated from discovered models
2. Persist selection as `{ providerID, modelID }`
3. Disable or auto-select when only one model is available

**Done when**:
- Selection persists across restarts
- UI reflects current selection correctly

---

### Phase 3 — Message Send Integration

**Objective**: Use the selected model when sending messages.

Steps:
1. Update message send logic to include selected model in request body
2. Treat model selection as best-effort (do not fail if ignored)
3. Maintain existing behavior when no model is selected

**Done when**:
- Requests include model identifiers when configured
- Plugin continues to function even if server ignores model

---

## Manual Validation Checklist

- Models load when server supports discovery
- Graceful message when discovery is unsupported
- Selected model persists across restart
- Selected model included in request payload
- Sending still works with no model selected

---

## Exit Criteria

Stop implementation when:
- A user can select a default model
- Messages are sent with the selected model without breaking core flow

Further enhancements require a new feature specification.
