# Feature Specification: Model Selection via OpenCode Server

**Feature Branch**: `003-opencode-provider-config`  
**Created**: 2026-01-26  
**Status**: Draft → Refined  
**Input**: User description:
"Allow selecting an AI model in the NoteBuddy plugin by discovering available providers and models from a local OpenCode server, and use the selected model when sending messages."

Context:
- Plugin already connects to a local `opencode serve` instance (spec 002) using RESTful JSON API v1.0.
- Provider credentials and model availability are managed by OpenCode itself.
- This feature adds **model discovery and selection only**, not provider configuration.

---

## Clarifications

### Session 2026-01-26

- Q: Performance expectations for model discovery → A: Under 5 seconds - This ensures good user experience without blocking the UI.
- Q: Scalability requirements for data volume → A: Support up to 50 models per provider - This balances usability with reasonable limits.
- Q: Protocol/versioning assumptions for OpenCode → A: RESTful JSON API v1.0 - This aligns with standard OpenCode protocols.

### Session 2026-01-28

- Q: What should happen when a user's previously selected model is no longer available from the server? → A: Fall back to server default and show a non-blocking notification that the previously selected model is unavailable
- Q: Should the plugin automatically refresh the model list when settings are opened, or only when the user clicks "Refresh Models"? → A: Manual refresh only (user must click button every time)
- Q: What should be displayed to the user while model discovery is in progress? → A: Show a loading indicator next to the "Refresh Models" button while keeping the rest of settings accessible

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Discover Available Models (Priority: P1)

As a NoteBuddy plugin user, I want the plugin to discover available AI models from the OpenCode server so I can choose which model to use.

**Why this priority**:  
Without knowing which models the server supports, model selection is impossible.

**Independent Test**:
Click "Refresh Models" button in settings → verify models are loaded from server or an appropriate message is shown.

**Acceptance Scenarios**:

1. **Given** the OpenCode server is running,
   **When** I click "Refresh Models" in the plugin settings,
   **Then** a loading indicator appears next to the button, the plugin calls the server capability endpoint, and available providers and models are loaded.

2. **Given** the OpenCode server is unreachable,
   **When** model discovery is attempted,
   **Then** a clear connection error is displayed (reuse health check messaging).

3. **Given** the OpenCode server does not support model discovery,
   **When** discovery is attempted,
   **Then** a non-blocking message is shown indicating that model selection is unavailable and the server default will be used.

---

### User Story 2 — Select Default AI Model (Priority: P1)

As a NoteBuddy plugin user, I want to select a default AI model so that my messages are sent using that model.

**Why this priority**:  
Model selection directly affects output quality and is a core customization feature.

**Independent Test**:  
Select a model → save settings → restart Obsidian → verify the selection persists and is used.

**Acceptance Scenarios**:

1. **Given** available models have been loaded,  
   **When** I select a model from the dropdown,  
   **Then** the selection is saved as the default model.

2. **Given** I have selected a default model,  
   **When** I restart Obsidian,  
   **Then** the previously selected model remains selected.

3. **Given** the server exposes only a single model,
   **When** I open settings,
   **Then** the model selection is auto-selected or disabled with a clear indication.

4. **Given** a previously selected model is no longer available from the server,
   **When** the plugin attempts to use it,
   **Then** the plugin falls back to the server default and displays a non-blocking notification informing the user that their selected model is unavailable.

---

### User Story 3 — Use Selected Model When Sending Messages (Priority: P2)

As a NoteBuddy plugin user, I want my selected model to be used when sending messages to the OpenCode server.

**Why this priority**:  
This connects model selection to actual plugin behavior.

**Independent Test**:  
Select a model → send a message → verify the request payload includes the selected model identifiers.

**Acceptance Scenarios**:

1. **Given** a default model has been selected,  
   **When** a message is sent,  
   **Then** the request includes `{ providerID, modelID }` in the message payload.

2. **Given** no model has been selected,  
   **When** a message is sent,  
   **Then** the message is sent without a model override and the server default is used.

3. **Given** the server ignores or does not support model selection,  
   **When** a message is sent,  
   **Then** the plugin does not fail and continues to function using the server default model.

---

### Edge Cases

- Model discovery endpoint is unavailable or returns an empty list.
- Selected model becomes unavailable after it was saved (plugin falls back to server default with non-blocking notification).
- Server ignores model selection due to version or configuration.
- Network or server errors during discovery or send.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Plugin MUST retrieve available providers and models from the OpenCode server (e.g. via a model discovery endpoint).
- **FR-002**: Plugin MUST provide a settings UI with a "Refresh Models" button to manually trigger model discovery.
- **FR-003**: Plugin MUST display a loading indicator next to the "Refresh Models" button during discovery, while keeping the rest of the settings UI accessible.
- **FR-004**: Plugin MUST provide a settings UI to select a default model (`providerID`, `modelID`).
- **FR-005**: Selected default model MUST persist across Obsidian restarts.
- **FR-006**: Plugin MUST send messages via the OpenCode server session API.
- **FR-007**: When a default model is selected, the plugin MUST include `{ providerID, modelID }` in the message payload on a best-effort basis.
- **FR-008**: Plugin MUST continue to function if the server ignores or does not support model selection.
- **FR-009**: Plugin MUST NOT manage or store third-party provider API keys or provider base URLs.
- **FR-010**: Plugin MUST display clear, actionable error messages for discovery and send failures.
- **FR-011**: When a previously selected model becomes unavailable, the plugin MUST fall back to the server default and display a non-blocking notification to the user.

---

## Key Entities *(include if feature involves data)*

- **Model Descriptor**:  
  Represents a model exposed by the OpenCode server (up to 50 models supported per provider), identified by `providerID` and `modelID`.

- **Plugin Settings**:  
  Stores the optional default model selection:
  - `defaultModel?: { providerID: string; modelID: string }`

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can discover and select a model in under 1 minute.
- **SC-002**: Selected model persists correctly across 100% of Obsidian restarts.
- **SC-003**: When supported by the server, selected model is included in 100% of message requests.
- **SC-004**: Plugin remains functional when model selection is unsupported or ignored by the server.
- **SC-005**: Model discovery completes in under 5 seconds.

### Success Indicators

- Model selection improves user control without complicating setup.
- Plugin remains robust across different OpenCode server versions.
- Provider credentials remain managed exclusively by OpenCode, not the plugin.

---
