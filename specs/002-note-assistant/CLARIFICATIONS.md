# Phase 1 Clarifications Summary

**Date**: 2026-01-23
**Feature**: Note Assistant Plugin (002-note-assistant)

## Overview

This document summarizes all clarifications made during Phase 1 planning to resolve ambiguities in the implementation plan.

---

## 1. OpenCode API Integration ✅

**Question**: What is the actual OpenCode API structure?

**Answer**: Session-based conversation API (not simple /api/process endpoint)

**Decision**:
- Use OpenCode's session-based API from specs/001-opencode-client/contracts/api.yaml
- Create session for each operation
- Send natural language prompts via message endpoint
- Parse text responses from parts array
- Clean up session after operation

**Impact**:
- Updated contracts/opencode-api.md with correct API structure
- Updated quickstart.md with session-based client implementation
- Added sessionId field to OperationRequest in data-model.md

**Reference**: `contracts/opencode-api-reference.yaml` (copied from 001 spec)

---

## 2. Annotation UI Design ✅

**Question**: What should the visual design of inline annotations look like?

**Answer**: Light background highlight with inline controls

**Decision**:
- Background: Light yellow (#FFF9E6) or light blue (#E6F3FF)
- Border: 1px solid with matching color (yellow: #FFE066, blue: #66B3FF)
- Padding: 8px
- Buttons: Small, inline, with clear labels (Accept/Reject/Edit)
- Position: Directly at suggestion location in editor

**Impact**:
- Provides clear visual specification for UI implementation
- Ensures consistent user experience
- Easy to implement with CodeMirror 6 decorations

**Reference**: `research.md` Phase 1 Clarifications section

---

## 3. Error Message Design ✅

**Question**: How much technical detail should error messages contain?

**Answer**: User-friendly messages without technical details

**Decision**:
- Simple, actionable error messages
- No HTTP status codes or stack traces
- Focus on what user can do to fix the issue
- Examples:
  - "Cannot connect to OpenCode service. Please check that the service is running."
  - "Authentication failed. Please check your API key in settings."
  - "Request timed out. The note may be too large."

**Impact**:
- Better user experience for non-technical users
- Clear guidance on how to resolve issues
- Consistent error messaging across all operations

**Reference**: `contracts/opencode-api.md` Error Handling section

---

## 4. Settings URL Validation ✅

**Question**: How strict should URL validation be for OpenCode endpoint?

**Answer**: Relaxed validation

**Decision**:
- Check basic URL format (http:// or https://)
- Allow any hostname (localhost, 127.0.0.1, or remote)
- Allow any port number
- No automatic connection testing during validation
- Provide manual "Test Connection" button in settings

**Impact**:
- Flexible configuration for different deployment scenarios
- User can configure remote OpenCode instances
- Simpler validation logic
- Better user control over when to test connection

**Reference**: `research.md` Phase 1 Clarifications section

---

## Summary of Changes

### Files Updated

1. **contracts/opencode-api.md**
   - Completely rewritten to use session-based API
   - Added health check, session creation, message sending, session deletion
   - Added operation-specific prompt templates
   - Added error handling specifications

2. **contracts/opencode-api-reference.yaml**
   - Copied from specs/001-opencode-client/contracts/api.yaml
   - Provides complete OpenAPI specification reference

3. **research.md**
   - Replaced "Open Questions for Phase 1" with "Phase 1 Clarifications (Resolved)"
   - Documented all 4 clarification decisions with details

4. **data-model.md**
   - Added sessionId field to OperationRequest interface

5. **quickstart.md**
   - Updated OpenCodeClient with session-based methods
   - Added createSession(), sendMessage(), deleteSession()
   - Removed old process() method

---

## Next Steps

All Phase 1 clarifications have been resolved and documented. The implementation plan is now complete and ready for:

1. **Task Breakdown**: Run `/speckit.tasks` to generate implementation tasks
2. **Implementation**: Follow quickstart.md for fast-path development
3. **Testing**: Implement tests as specified in research.md

---

## Validation Checklist

- [x] OpenCode API contract validated against actual API specification
- [x] Annotation UI design specified with colors and layout
- [x] Error messages defined with user-friendly approach
- [x] URL validation rules clarified (relaxed validation)
- [x] All affected files updated consistently
- [x] Documentation cross-references added

---

**All Clarifications Complete** ✅
