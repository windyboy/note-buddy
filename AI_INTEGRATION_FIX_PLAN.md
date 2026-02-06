# AI Integration Fix Plan

**Date:** 2026-02-06  
**Source:** `AI_INTEGRATION_REVIEW.md`  
**Goal:** Fix all issues identified in the AI integration review and align behavior with Specs 002/003/005.

## 1. Scope

This plan covers all findings in `AI_INTEGRATION_REVIEW.md`:
1. High: selected model not applied during streaming send.
2. High: "Use server default" path can crash or block sending.
3. Medium: missing plugin-level `onModelUnavailable` handling.
4. Low: stale/outdated report statements must remain cleaned up.

## 2. Fix Strategy

- Keep current architecture (`src/main.ts` + `src/chat-view.ts`) and patch behavior at request path boundaries.
- Make model resolution explicit and null-safe before every send.
- Ensure request payload uses active session model when selected, and omits `model` when user chooses server default.
- Add regression tests for each bug path.
- Re-validate build/tests and update review docs if implementation details change.

## 3. Implementation Plan

### Phase 1: Correct model resolution in ChatView (High)

**Files:** `src/chat-view.ts`

Tasks:
1. Introduce a helper for effective model resolution (priority: session model -> plugin default -> server default).
2. Treat empty/undefined model as valid "Use server default" mode.
3. Remove unsafe string operations on possibly undefined values (`includes`, `split` without guards).
4. Keep model availability validation only when a concrete model is selected.

Acceptance criteria:
- No runtime error when no model is selected.
- Sending is allowed when model is empty (server default).
- Unavailable-model notice appears only for explicit, concrete model selection.

### Phase 2: Apply selected model to outgoing requests (High)

**Files:** `src/chat-view.ts`, `src/service.ts` (if API extension needed), `src/models.ts` (only if types need refinement)

Tasks:
1. Ensure send path builds a `SendMessage` payload with `model` set from active selection when present.
2. Use a service API that accepts per-message model for send/stream.
3. If current `streamMessage` signature is insufficient, extend it to accept an optional model reference.
4. Maintain backward compatibility for existing callers.

Acceptance criteria:
- Switching session/model changes actual request model immediately.
- Streaming path and non-streaming path use consistent model selection behavior.

### Phase 3: Implement model-unavailable recovery hook (Medium)

**Files:** `src/main.ts`, optional UI touchpoints in `src/settings.ts` / `src/chat-view.ts`

Tasks:
1. Add `onModelUnavailable()` in plugin class.
2. Recovery behavior:
   - clear invalid `defaultModelId` (or downgrade to server default),
   - persist plugin data,
   - optionally show one user-facing notice.
3. Wire callback effects so UI reflects updated state on next render/open.

Acceptance criteria:
- When fallback is triggered, plugin state remains valid and persisted.
- User is not stuck with a repeatedly failing default model.

### Phase 4: Regression tests and coverage hardening (High)

**Files:** `tests/unit/ChatView.test.ts`, `tests/unit/service.test.ts`, optional new tests under `tests/integration/`

Tasks:
1. Add tests for server-default send path (no explicit model).
2. Add tests that verify selected model is included in outgoing request payload.
3. Add tests for unavailable-model fallback and plugin callback behavior.
4. Replace placeholder ChatView unit tests with behavior-oriented assertions around real class logic.

Acceptance criteria:
- Tests fail before fix and pass after fix for all listed bug classes.
- `bun test` remains fully green.

### Phase 5: Documentation and consistency (Low)

**Files:** `AI_INTEGRATION_REVIEW.md`, optional `verification-report.md`

Tasks:
1. Ensure review report remains aligned with final code state.
2. Record fix completion status and residual risks.

Acceptance criteria:
- No outdated architectural claims remain in review docs.

## 4. Execution Order

1. Phase 1
2. Phase 2
3. Phase 3
4. Phase 4
5. Phase 5

Reasoning: fix runtime send correctness first, then resilience, then lock behavior with tests and docs.

## 5. Validation Checklist

Run after implementation:
1. `bun run build`
2. `bun test`
3. Manual smoke checks in Obsidian:
   - send with explicit model;
   - send with "Use server default";
   - switch models between sessions and confirm behavior;
   - trigger unavailable model scenario and verify fallback + state recovery.

## 6. Risks and Mitigations

1. Risk: API contract mismatch when adding explicit model to streaming path.  
   Mitigation: keep payload shape aligned with `SendMessage` and existing service methods.

2. Risk: new logic breaks older saved sessions with malformed `modelId`.  
   Mitigation: add defensive parsing + fallback to server default.

3. Risk: test suite gives false confidence due to mocks.  
   Mitigation: add at least one integration-style test around request payload composition.

## 7. Definition of Done

- All 4 findings in `AI_INTEGRATION_REVIEW.md` are resolved.
- Build and tests pass.
- Chat send path is null-safe and model-selection-correct.
- Fallback recovery updates persisted plugin state.
- Documentation reflects current implementation reality.
