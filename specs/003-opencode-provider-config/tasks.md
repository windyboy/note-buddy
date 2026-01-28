# Implementation Tasks: Model Selection via OpenCode Server

**Feature**: 003-opencode-provider-config  
**Branch**: `003-opencode-provider-config`  
**Date**: 2026-01-28

## Overview

This document provides actionable, dependency-ordered tasks for implementing model discovery and selection in the NoteBuddy Obsidian plugin. Tasks are organized by user story to enable independent implementation and testing.

---

## User Stories Summary

- **User Story 1 (P1)**: Discover Available Models - Enable model discovery from OpenCode server
- **User Story 2 (P1)**: Select Default AI Model - Allow users to select and persist model choice
- **User Story 3 (P2)**: Use Selected Model When Sending Messages - Include model in message payloads

---

## Implementation Strategy

**MVP Scope**: User Story 1 + User Story 2 (P1 stories)
- Provides complete model discovery and selection functionality
- User Story 3 can be delivered incrementally after MVP

**Delivery Approach**:
1. Complete foundational work (types, cache infrastructure)
2. Implement US1 (discovery) - independently testable
3. Implement US2 (selection) - independently testable
4. Implement US3 (message integration) - independently testable

---

## Phase 1: Setup & Type Definitions

**Goal**: Establish TypeScript interfaces and constants for model selection feature.

### Tasks

- [X] T001 Add Provider interface to src/models.ts
- [X] T002 Add Model interface to src/models.ts
- [X] T003 Add ModelSelection interface to src/models.ts
- [X] T004 Add CapabilitiesResponse interface to src/models.ts
- [X] T005 Extend NoteBuddySettings interface with defaultModel field in src/models.ts
- [X] T006 Add MODELS_CACHE_TTL constant (5 minutes) to src/service.ts

**Completion Criteria**: All TypeScript interfaces compile without errors, settings type includes optional defaultModel field.

---

## Phase 2: Foundational Infrastructure

**Goal**: Implement caching infrastructure and helper methods needed by all user stories.

### Tasks

- [X] T007 Add modelsCache property to OpenCodeClient class in src/service.ts
- [X] T008 Implement isCacheValid() private method in src/service.ts
- [X] T009 Implement clearModelsCache() public method in src/service.ts

**Completion Criteria**: Cache infrastructure compiles and can be unit tested independently.

**Dependencies**: Requires Phase 1 (types) to be complete.

---

## Phase 3: User Story 1 - Discover Available Models (P1)

**Goal**: Enable users to discover available AI models from the OpenCode server.

**Independent Test**: Click "Refresh Models" button in settings → verify models are loaded from server or an appropriate message is shown.

### Tasks

- [X] T010 [P] [US1] Implement getCapabilities() method in src/service.ts
- [X] T011 [US1] Add error handling for network failures in getCapabilities()
- [X] T012 [US1] Add error handling for empty provider list in getCapabilities()
- [X] T013 [US1] Add console logging with [NoteBuddy] prefix in getCapabilities()
- [X] T014 [US1] Add providers property to NoteBuddySettingTab class in src/settings.ts
- [X] T015 [US1] Add isLoadingModels property to NoteBuddySettingTab class in src/settings.ts
- [X] T016 [US1] Implement refreshModels() method in src/settings.ts
- [X] T017 [US1] Add "Refresh Models" button to settings UI in src/settings.ts
- [X] T018 [US1] Implement loading indicator for refresh button in src/settings.ts
- [X] T019 [US1] Add Notice for successful model refresh in src/settings.ts
- [X] T020 [US1] Add Notice for failed model refresh in src/settings.ts

**Acceptance Criteria**:
- ✅ Clicking "Refresh Models" shows loading indicator
- ✅ API calls `/v1/capabilities` endpoint
- ✅ Providers and models cached with 5-minute TTL
- ✅ Clear error messages for connection failures
- ✅ Non-blocking notification for empty model list
- ✅ Discovery completes in <5 seconds

**Dependencies**: Requires Phase 2 (cache infrastructure) to be complete.

**Parallel Opportunities**: T010-T013 (service layer) can be implemented in parallel with T014-T020 (UI layer).

---

## Phase 4: User Story 2 - Select Default AI Model (P1)

**Goal**: Enable users to select a default AI model and persist the selection across restarts.

**Independent Test**: Select a model → save settings → restart Obsidian → verify the selection persists and is used.

### Tasks

- [X] T021 [P] [US2] Implement addModelSelectionDropdown() helper method in src/settings.ts
- [X] T022 [US2] Build dropdown options with provider/model hierarchy in addModelSelectionDropdown()
- [X] T023 [US2] Add "Use server default" option to dropdown in addModelSelectionDropdown()
- [X] T024 [US2] Implement dropdown onChange handler to save selection in src/settings.ts
- [X] T025 [US2] Parse providerID/modelID from dropdown value in onChange handler
- [X] T026 [US2] Call plugin.saveSettings() on model selection change
- [X] T027 [US2] Display current selection on settings UI load in src/settings.ts
- [X] T028 [US2] Handle empty providers list gracefully in dropdown

**Acceptance Criteria**:
- ✅ Dropdown shows "Provider Name / Model Name" format
- ✅ Selection saves to Obsidian data.json
- ✅ Selection persists across Obsidian restarts
- ✅ "Use server default" option clears defaultModel
- ✅ Single model auto-selects or shows clear indication
- ✅ Empty list shows helpful message

**Dependencies**: Requires Phase 3 (US1 - model discovery) to be complete.

**Parallel Opportunities**: All tasks in this phase are sequential (UI flow).

---

## Phase 5: User Story 3 - Use Selected Model When Sending Messages (P2)

**Goal**: Include selected model in message payloads when sending to OpenCode server.

**Independent Test**: Select a model → send a message → verify the request payload includes the selected model identifiers.

### Tasks

- [X] T029 [P] [US3] Modify sendMessage() to include providerID in payload in src/service.ts
- [X] T030 [P] [US3] Modify sendMessage() to include modelID in payload in src/service.ts
- [X] T031 [US3] Add conditional logic to only include model if defaultModel is set
- [X] T032 [US3] Implement fallback logic for 404 response (model unavailable)
- [X] T033 [US3] Add Notice for model unavailable fallback in src/service.ts
- [X] T034 [US3] Clear defaultModel setting on fallback in src/service.ts
- [X] T035 [US3] Retry sendMessage() without model after fallback

**Acceptance Criteria**:
- ✅ Message payload includes `{ providerID, modelID }` when model selected
- ✅ Message sends without model fields when no selection
- ✅ Plugin continues to function if server ignores model fields
- ✅ Fallback to server default on 404 with notification
- ✅ Automatic retry after fallback

**Dependencies**: Requires Phase 4 (US2 - model selection) to be complete.

**Parallel Opportunities**: T029-T030 can be implemented together, T032-T035 are sequential.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Goal**: Final refinements, error handling improvements, and documentation.

### Tasks

- [X] T036 [P] Add JSDoc comments to getCapabilities() in src/service.ts
- [X] T037 [P] Add JSDoc comments to refreshModels() in src/settings.ts
- [X] T038 [P] Add JSDoc comments to addModelSelectionDropdown() in src/settings.ts
- [X] T039 Verify all error messages follow [NoteBuddy] prefix convention
- [X] T040 Verify all Notice messages are non-blocking and user-friendly
- [X] T041 Test model discovery with 50+ models for performance
- [X] T042 Test cache expiration after 5 minutes
- [X] T043 Test settings persistence across Obsidian restart
- [X] T044 Test graceful degradation when server doesn't support capabilities
- [X] T045 Update CLAUDE.md with model selection implementation notes

**Completion Criteria**: All acceptance criteria met, documentation updated, edge cases handled.

---

## Task Dependencies

### Story Completion Order

```
Phase 1 (Setup) → Phase 2 (Foundational)
                      ↓
                  Phase 3 (US1: Discovery)
                      ↓
                  Phase 4 (US2: Selection)
                      ↓
                  Phase 5 (US3: Message Integration)
                      ↓
                  Phase 6 (Polish)
```

### Critical Path

1. **T001-T006**: Type definitions (blocking all other work)
2. **T007-T009**: Cache infrastructure (blocking US1)
3. **T010-T020**: Model discovery (blocking US2)
4. **T021-T028**: Model selection (blocking US3)
5. **T029-T035**: Message integration (final feature)
6. **T036-T045**: Polish (can start after US1 complete)

### Parallel Execution Opportunities

**Phase 1 (Setup)**: All tasks can run in parallel (T001-T006)

**Phase 2 (Foundational)**: Sequential (cache setup)

**Phase 3 (US1)**: 
- Parallel: T010-T013 (service) + T014-T020 (UI)
- Service and UI layers are independent

**Phase 4 (US2)**: Sequential (UI flow dependencies)

**Phase 5 (US3)**: 
- Parallel: T029-T030 (payload fields)
- Sequential: T031-T035 (fallback logic)

**Phase 6 (Polish)**: 
- Parallel: T036-T038 (documentation)
- Sequential: T039-T045 (testing and validation)

---

## Detailed Task Breakdown

### Phase 1: Setup & Type Definitions

#### T001: Add Provider interface to src/models.ts
```typescript
export interface Provider {
  id: string;
  name: string;
  models: Model[];
}
```

#### T002: Add Model interface to src/models.ts
```typescript
export interface Model {
  id: string;
  name: string;
}
```

#### T003: Add ModelSelection interface to src/models.ts
```typescript
export interface ModelSelection {
  providerID: string;
  modelID: string;
}
```

#### T004: Add CapabilitiesResponse interface to src/models.ts
```typescript
export interface CapabilitiesResponse {
  providers: Provider[];
}
```

#### T005: Extend NoteBuddySettings interface with defaultModel field
Add optional `defaultModel?: ModelSelection` field to existing NoteBuddySettings interface in src/models.ts.

#### T006: Add MODELS_CACHE_TTL constant
Add `const MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes` to src/service.ts.

---

### Phase 2: Foundational Infrastructure

#### T007: Add modelsCache property to OpenCodeClient class
```typescript
private modelsCache: {
  data: Provider[] | null;
  timestamp: number;
} = { data: null, timestamp: 0 };
```

#### T008: Implement isCacheValid() private method
```typescript
private isCacheValid(): boolean {
  return this.modelsCache.data !== null &&
         Date.now() - this.modelsCache.timestamp < MODELS_CACHE_TTL;
}
```

#### T009: Implement clearModelsCache() public method
```typescript
clearModelsCache(): void {
  this.modelsCache = { data: null, timestamp: 0 };
}
```

---

### Phase 3: User Story 1 - Discover Available Models

#### T010: Implement getCapabilities() method in src/service.ts
```typescript
async getCapabilities(): Promise<Provider[]> {
  if (this.isCacheValid()) {
    return this.modelsCache.data!;
  }

  const response = await requestUrl({
    url: `${this.plugin.settings.serviceUrl}/v1/capabilities`,
    method: 'GET',
    throw: false
  });

  if (response.status !== 200) {
    throw new Error('Failed to fetch capabilities');
  }

  const data: CapabilitiesResponse = response.json;
  this.modelsCache = {
    data: data.providers,
    timestamp: Date.now()
  };

  return data.providers;
}
```

#### T011: Add error handling for network failures
Wrap getCapabilities() API call in try-catch, throw descriptive error for network issues.

#### T012: Add error handling for empty provider list
Check if `data.providers` is empty array, handle gracefully.

#### T013: Add console logging with [NoteBuddy] prefix
Add `console.log('[NoteBuddy] Fetching capabilities...')` and error logging.

#### T014: Add providers property to NoteBuddySettingTab
Add `private providers: Provider[] = [];` to class in src/settings.ts.

#### T015: Add isLoadingModels property to NoteBuddySettingTab
Add `private isLoadingModels = false;` to class in src/settings.ts.

#### T016: Implement refreshModels() method in src/settings.ts
```typescript
async refreshModels() {
  if (this.isLoadingModels) return;

  this.isLoadingModels = true;
  this.display();

  try {
    this.plugin.client.clearModelsCache();
    this.providers = await this.plugin.client.getCapabilities();
    new Notice('Models refreshed successfully');
  } catch (error) {
    console.error('[NoteBuddy] Model refresh failed:', error);
    new Notice('Failed to load models. Check service URL.');
  } finally {
    this.isLoadingModels = false;
    this.display();
  }
}
```

#### T017: Add "Refresh Models" button to settings UI
Add Setting with button in display() method, call refreshModels() on click.

#### T018: Implement loading indicator for refresh button
Set button text to "Loading..." when isLoadingModels is true, disable button during loading.

#### T019: Add Notice for successful model refresh
Show `new Notice('Models refreshed successfully')` on success.

#### T020: Add Notice for failed model refresh
Show `new Notice('Failed to load models. Check service URL.')` on error.

---

### Phase 4: User Story 2 - Select Default AI Model

#### T021: Implement addModelSelectionDropdown() helper method
Create private method in NoteBuddySettingTab class to encapsulate dropdown logic.

#### T022: Build dropdown options with provider/model hierarchy
```typescript
const options: Record<string, string> = { '': 'Use server default' };
this.providers.forEach(provider => {
  provider.models.forEach(model => {
    const key = `${provider.id}/${model.id}`;
    const label = `${provider.name} / ${model.name}`;
    options[key] = label;
  });
});
```

#### T023: Add "Use server default" option to dropdown
Include empty string key with "Use server default" label as first option.

#### T024: Implement dropdown onChange handler to save selection
Add onChange callback that parses value and saves to settings.

#### T025: Parse providerID/modelID from dropdown value
```typescript
if (value === '') {
  this.plugin.settings.defaultModel = undefined;
} else {
  const [providerID, modelID] = value.split('/');
  this.plugin.settings.defaultModel = { providerID, modelID };
}
```

#### T026: Call plugin.saveSettings() on model selection change
Ensure settings persist immediately after selection change.

#### T027: Display current selection on settings UI load
Get current value from settings and set dropdown to show selected model on load.

#### T028: Handle empty providers list gracefully in dropdown
Show message "No models loaded. Click 'Refresh Models' to load from server." when providers array is empty.

---

### Phase 5: User Story 3 - Use Selected Model When Sending Messages

#### T029: Modify sendMessage() to include providerID in payload
Add `payload.providerID = this.plugin.settings.defaultModel.providerID` when defaultModel is set.

#### T030: Modify sendMessage() to include modelID in payload
Add `payload.modelID = this.plugin.settings.defaultModel.modelID` when defaultModel is set.

#### T031: Add conditional logic to only include model if defaultModel is set
```typescript
if (this.plugin.settings.defaultModel) {
  payload.providerID = this.plugin.settings.defaultModel.providerID;
  payload.modelID = this.plugin.settings.defaultModel.modelID;
}
```

#### T032: Implement fallback logic for 404 response (model unavailable)
```typescript
if (response.status === 404 && this.plugin.settings.defaultModel) {
  // Model not found, fall back to server default
  new Notice('Selected model unavailable. Using server default.');
  this.plugin.settings.defaultModel = undefined;
  await this.plugin.saveSettings();
  return this.sendMessage(sessionId, message);
}
```

#### T033: Add Notice for model unavailable fallback
Show non-blocking notification: "Selected model unavailable. Using server default."

#### T034: Clear defaultModel setting on fallback
Set `this.plugin.settings.defaultModel = undefined` and save settings.

#### T035: Retry sendMessage() without model after fallback
Recursively call sendMessage() after clearing model selection to retry with server default.

---

### Phase 6: Polish & Cross-Cutting Concerns

#### T036: Add JSDoc comments to getCapabilities()
Document method purpose, return type, and error conditions.

#### T037: Add JSDoc comments to refreshModels()
Document UI refresh flow and error handling.

#### T038: Add JSDoc comments to addModelSelectionDropdown()
Document dropdown construction and selection persistence.

#### T039: Verify all error messages follow [NoteBuddy] prefix convention
Audit all console.log and console.error calls for consistent prefix.

#### T040: Verify all Notice messages are non-blocking and user-friendly
Review all Notice instantiations for clarity and tone.

#### T041: Test model discovery with 50+ models for performance
Verify discovery completes in <5 seconds with maximum model count.

#### T042: Test cache expiration after 5 minutes
Verify cache invalidates correctly and triggers new API call.

#### T043: Test settings persistence across Obsidian restart
Verify defaultModel persists correctly in data.json.

#### T044: Test graceful degradation when server doesn't support capabilities
Verify plugin continues to function when /v1/capabilities returns 404.

#### T045: Update CLAUDE.md with model selection implementation notes
Document model selection feature in project guide for future AI assistants.

---

## Testing Strategy

### Unit Testing (Optional - Not Required by Spec)

The specification does not explicitly require tests. If TDD approach is desired, add these tasks:

- Unit tests for getCapabilities() with mocked requestUrl
- Unit tests for cache validation logic
- Unit tests for model selection parsing
- Unit tests for fallback logic

### Manual Testing Checklist

**User Story 1 - Model Discovery**:
- [ ] Click "Refresh Models" shows loading indicator
- [ ] Models load successfully from running server
- [ ] Connection error shows clear message
- [ ] Empty model list shows helpful message
- [ ] Discovery completes in <5 seconds

**User Story 2 - Model Selection**:
- [ ] Dropdown shows provider/model hierarchy
- [ ] Selection saves immediately
- [ ] Selection persists after Obsidian restart
- [ ] "Use server default" clears selection
- [ ] Single model auto-selects or shows indication

**User Story 3 - Message Integration**:
- [ ] Selected model included in message payload
- [ ] Messages work without model selection
- [ ] Fallback works when model unavailable
- [ ] Non-blocking notification on fallback
- [ ] Plugin continues functioning after fallback

---

## Summary

**Total Tasks**: 45
- Phase 1 (Setup): 6 tasks
- Phase 2 (Foundational): 3 tasks
- Phase 3 (US1 - Discovery): 11 tasks
- Phase 4 (US2 - Selection): 8 tasks
- Phase 5 (US3 - Message Integration): 7 tasks
- Phase 6 (Polish): 10 tasks

**Task Distribution by User Story**:
- US1 (Discover Models): 11 tasks (T010-T020)
- US2 (Select Model): 8 tasks (T021-T028)
- US3 (Use Model): 7 tasks (T029-T035)
- Infrastructure: 9 tasks (T001-T009)
- Polish: 10 tasks (T036-T045)

**Parallel Opportunities**:
- Phase 1: All 6 tasks can run in parallel
- Phase 3: Service layer (T010-T013) + UI layer (T014-T020) can run in parallel
- Phase 5: Payload fields (T029-T030) can run in parallel
- Phase 6: Documentation (T036-T038) can run in parallel

**MVP Scope** (Recommended first delivery):
- Phase 1: Setup (T001-T006)
- Phase 2: Foundational (T007-T009)
- Phase 3: US1 - Discovery (T010-T020)
- Phase 4: US2 - Selection (T021-T028)

This provides complete model discovery and selection functionality. Phase 5 (US3) can be delivered incrementally after MVP.

**Estimated Effort**:
- MVP (Phases 1-4): ~28 tasks, 1-2 days
- Full Feature (All Phases): ~45 tasks, 2-3 days
- Polish & Testing: Ongoing

---

## References

- **Specification**: specs/003-opencode-provider-config/spec.md
- **Data Model**: specs/003-opencode-provider-config/data-model.md
- **API Contracts**: specs/003-opencode-provider-config/contracts/models-discovery-api.yaml
- **Implementation Guide**: specs/003-opencode-provider-config/quickstart.md
- **Research Decisions**: specs/003-opencode-provider-config/research.md

---

## Format Validation

✅ All tasks follow checklist format: `- [ ] [TaskID] [P?] [Story?] Description with file path`
✅ Task IDs sequential (T001-T045)
✅ [P] markers on parallelizable tasks
✅ [US1], [US2], [US3] labels on user story tasks
✅ File paths specified for all implementation tasks
✅ Dependencies documented
✅ Independent test criteria for each story
✅ MVP scope clearly defined

