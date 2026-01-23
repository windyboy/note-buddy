# Feature Specification: Note Assistant Plugin

**Branch**: `002-note-assistant`
**Created**: 2026-01-23
**Status**: Draft

## Overview

Obsidian plugin providing AI-powered note operations: summarization, task extraction, structure improvement, and link suggestions. All operations require explicit user confirmation via inline annotations.

## Clarifications

### Session 2026-01-23

- OpenCode API for AI processing (local service, e.g., localhost:8000)
- Inline annotations with accept/reject/edit
- Unlimited API usage
- Command palette access only
- Entire vault search for links
- Manual retry on errors
- Smart insertion positions (summary at top, tasks at end, structure/links in-place)
- Operation queue (sequential processing, one at a time)
- Offline mode: completely disabled, show error message

## User Scenarios & Testing

### US1 - Summarize Note (P1)

Generate 3-5 bullet point summary of note content.

**Test**: Trigger on multi-paragraph note, verify inline annotation with summary, accept/reject.

**Acceptance**:
1. Command generates summary from note content
2. Summary shown as inline annotation with accept/reject buttons
3. Accept inserts summary at note top
4. Reject removes annotation, no changes

---

### US2 - Extract Tasks (P1)

Identify and extract action items from natural language text.

**Test**: Note with action items ("need to call", "remember to"), verify task extraction and insertion.

**Acceptance**:
1. Command identifies tasks from natural language
2. Tasks shown as inline annotations with checkboxes
3. Accept inserts tasks in "Tasks" section with markdown checkboxes
4. No tasks found shows notification

---

### US3 - Improve Structure (P2)

Suggest structural improvements (headings, paragraph splits).

**Test**: Unstructured note, verify specific suggestions with before/after preview.

**Acceptance**:
1. Command suggests specific improvements
2. Each suggestion shown as inline annotation with preview
3. Individual accept/reject per suggestion
4. Only accepted changes applied

---

### US4 - Suggest Links (P3)

Find related notes across entire vault, suggest links.

**Test**: Note with topics, verify vault-wide search and link suggestions.

**Acceptance**:
1. Command searches entire vault for related notes
2. Suggestions shown as inline annotations with explanations
3. Edit link text/target before accepting
4. Accept inserts links at annotation locations

---

### Edge Cases

- Empty/whitespace-only notes
- Notes <50 words
- Code-only notes
- Notes >10k words (show warning, may have performance issues)
- Special markdown (tables, math, diagrams)
- Partial text selections
- Concurrent operation requests (queued sequentially)
- User cancellation during processing
- API errors (manual retry required)
- Offline/no network (all operations disabled)
- OpenCode service unavailable (connection refused)

## Requirements

### Functional

- **FR-001**: Command palette commands: "Note Assistant: Summarize/Extract Tasks/Improve Structure/Suggest Links"
- **FR-002**: Support full note or text selection
- **FR-003**: Inline annotations showing proposed changes at target locations
- **FR-004**: Accept/reject buttons per annotation
- **FR-005**: Edit suggestion text before accepting
- **FR-006**: Individual accept/reject for multiple suggestions
- **FR-007**: Preserve original on reject/cancel
- **FR-008**: Loading indicators during processing
- **FR-009**: Error messages on failure, manual retry
- **FR-010**: Preserve markdown formatting
- **FR-011**: Single note/selection scope only
- **FR-012**: Link suggestions search entire vault
- **FR-013**: Smart insertion - summary at note top, tasks at end, structure/links in-place
- **FR-014**: Operation queue - process one operation at a time sequentially
- **FR-015**: Offline detection - disable all operations, show clear error message

### Entities

- **Operation Request**: Operation type, target content (note/selection), timestamp
- **Operation Result**: Suggestions, explanations, confidence scores
- **Preview State**: Original content, proposed changes, user decisions
- **Note Context**: Content, metadata (title, path), active selection
- **Operation Queue**: Pending operations awaiting sequential processing

## Success Criteria

- **SC-001**: <5s response time for notes ≤5k words
- **SC-002**: Summary quality acceptable to users
- **SC-003**: Task extraction identifies actionable items
- **SC-004**: <30s full workflow (trigger → review → accept/reject)
- **SC-005**: Zero unintended modifications
- **SC-006**: Support standard markdown (headings, lists, links, bold/italic)

## Non-Functional Requirements

### Performance

- <5s operation completion (notes ≤5k words)
- <1s preview render
- Non-blocking UI during processing

### Usability

- Command palette discovery (prefix: "Note Assistant:")
- Clear visual distinction for annotations
- Actionable error messages

### Reliability

- Graceful handling of malformed markdown
- Cancellable operations
- No data corruption on failure
- Manual retry on errors (no auto-retry)

### Security & Privacy

- User configures OpenCode endpoint URL in settings
- HTTP/HTTPS connection based on user configuration
- Clear notification when sending data to OpenCode service
- Secure storage of endpoint configuration
- No external cloud transmission (local service only)

## Assumptions

- Obsidian installed, basic user familiarity
- Notes primarily prose (not code/data)
- Local OpenCode service running (e.g., localhost:8000)
- User has network access to local OpenCode service
- Notes typically 100-5k words
- Local vault storage, plugin has access
- User accepts sequential operation processing

## Dependencies

- Local OpenCode service (NLP, content analysis)
- Network access to OpenCode endpoint
- Obsidian Plugin API (note access, editor)
- Markdown parsing capability
- User vault access permission

## Out of Scope

- Auto-modification without confirmation
- Batch operations (multiple notes)
- Real-time collaboration
- External task management integration
- Custom user-defined operations
- Advanced undo/redo beyond Obsidian built-in
- Version control/change tracking
