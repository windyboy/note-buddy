# Detailed Clarifications - Note Assistant Plugin

**Date**: 2026-01-23
**Purpose**: Document all clarifications from research.md and quickstart.md review

## Overview

This document captures all ambiguities found in research.md and quickstart.md, along with their resolutions through structured questioning.

---

## Batch 1: Core Architecture Decisions

### 1.1 API Key Management ✅

**Issue**: OpenCodeClient constructor requires apiKey parameter, but quickstart.md line 91 only passes endpoint.

**Question**: Where should the API key come from?

**Answer**: 需要配置 OpenCode 的模型使用以及 apiKey，但这个 spec 可以暂时先不管这个需求，后面再完成

**Decision**:
- Use default/empty apiKey for now
- Add TODO comment for future implementation
- Settings will include apiKey field but it's optional for MVP

**Impact**:
- OpenCodeClient constructor: `constructor(endpoint: string, apiKey: string = '')`
- Add comment: `// TODO: Implement API key configuration in future iteration`

---

### 1.2 Health Check Endpoint ✅

**Issue**: research.md line 35 mentions `curl http://localhost:8000/api/health`, but actual API is `/global/health`.

**Question**: Which endpoint should be used?

**Answer**: 使用 server 的 openapi 文档里的端口

**Decision**:
- Use `/global/health` as specified in OpenCode API spec
- Update all documentation to use correct endpoint

**Impact**:
- Update quickstart.md line 35: `curl http://localhost:8000/global/health`
- Update expected response to match API spec: `{"healthy": true, "version": "1.0.0"}`

---

### 1.3 OpenCodeClient Initialization ✅

**Issue**: quickstart.md line 91 only passes endpoint to OpenCodeClient, but constructor needs apiKey.

**Question**: How to fix the initialization?

**Answer**: 使用默认值

**Decision**:
- Modify OpenCodeClient constructor to have default apiKey parameter
- Constructor signature: `constructor(endpoint: string, apiKey: string = '')`

**Impact**:
- Update quickstart.md line 91: Keep as is, will use default empty apiKey
- Add constructor default parameter in OpenCodeClient class

---

### 1.4 Test Code Update ✅

**Issue**: quickstart.md line 292 test code calls non-existent `client.process()` method.

**Question**: How to fix the test?

**Answer**: 使用新 API

**Decision**:
- Update test to use session-based API: createSession() + sendMessage() + deleteSession()
- Remove references to old process() method

**Impact**:
- Rewrite integration test example in quickstart.md
- Test should create session, send message, verify response, delete session

---

## Batch 2: Implementation Details

### 2.1 Markdown Parser Choice ✅

**Issue**: research.md Q4 mentions using 'lightweight markdown parser' but doesn't specify which library.

**Question**: What should be used for markdown parsing?

**Answer**: 纯字符串操作

**Decision**:
- Use pure string operations and regex
- No external markdown parsing library
- Implement simple line-based parsing for headings, lists, etc.

**Impact**:
- Update research.md Q4 to clarify: "Use string operations and regex only"
- No need to add markdown parsing dependencies

---

### 2.2 Chunk Overlap Implementation ✅

**Issue**: research.md Q7 mentions 200 word overlap between chunks but doesn't explain implementation.

**Question**: How should overlap be implemented?

**Answer**: 两边各一半

**Decision**:
- Share 200 words between chunks (100 words each side)
- Last 100 words of chunk N = first 100 words of chunk N+1
- Helps maintain context across chunk boundaries

**Impact**:
- Update chunking algorithm to include overlap logic
- Document overlap strategy in research.md Q7

---

### 2.3 Vault Cache Refresh ✅

**Issue**: research.md Q8 mentions refreshing cache on vault changes but doesn't explain how to detect changes.

**Question**: How to detect vault changes?

**Answer**: 事件驱动更新

**Decision**:
- Listen to Obsidian vault events: create, delete, rename
- Update cache in real-time when events fire
- Use `this.registerEvent()` to listen to vault events

**Impact**:
- Add event listeners in plugin onload()
- Implement cache update logic in event handlers

---

### 2.4 Queue Cancellation Mechanism ✅

**Issue**: research.md Q5 mentions allowing cancellation of queued operations but doesn't explain mechanism.

**Question**: How to implement cancellation?

**Answer**: 支持取消

**Decision**:
- Add AbortController for each operation
- Support cancellation of both queued and in-progress operations
- Provide cancel button in UI

**Impact**:
- Add AbortController to Operation interface
- Implement cancel() method in OperationQueue
- Add cancel button to queue status UI

---

## Batch 3: UI and User Experience

### 3.1 Edit Button Behavior ✅

**Issue**: Accept/Reject/Edit buttons mentioned but Edit behavior not specified.

**Question**: What happens when user clicks Edit?

**Answer**: 内联编辑框

**Decision**:
- Show inline text input/textarea when Edit is clicked
- User can modify suggestion content
- After editing, show Accept/Cancel buttons
- Accept applies edited content, Cancel reverts to original suggestion

**Impact**:
- Add edit mode to AnnotationWidget
- Implement inline editing UI with text input
- Handle edit state transitions

---

### 3.2 Queue Status Display ✅

**Issue**: research.md Q5 mentions showing queue position but doesn't specify where.

**Question**: Where to display queue status?

**Answer**: 横幅通知

**Decision**:
- Show banner notification at top of editor
- Display message like "Processing... 2 operations ahead"
- Banner auto-dismisses when queue is empty

**Impact**:
- Implement banner notification component
- Update on queue state changes
- Position at editor top, non-intrusive

---

### 3.3 Loading Indicator Display ✅

**Issue**: quickstart.md Phase 4 mentions loading indicators but doesn't specify form.

**Question**: How should loading indicators be displayed?

**Answer**: 编辑器覆盖层

**Decision**:
- Show semi-transparent overlay on editor during processing
- Display spinner and operation name
- Prevent user interaction with editor while loading

**Impact**:
- Implement overlay component with loading animation
- Show/hide based on operation state
- Add CSS for overlay styling

---

### 3.4 Multiple Suggestions Display ✅

**Issue**: When operation returns multiple suggestions, how to display in UI?

**Question**: How to show multiple suggestions?

**Answer**: 逐个显示

**Decision**:
- Show one suggestion at a time
- After Accept/Reject, automatically show next suggestion
- Display progress indicator (e.g., "Suggestion 2 of 5")
- User can skip to next/previous suggestion

**Impact**:
- Implement suggestion navigation logic
- Add next/previous buttons to annotation UI
- Track current suggestion index

---

## Batch 4: Error Handling and Edge Cases

### 4.1 Session Creation Failure ✅

**Issue**: How to handle OpenCode session creation failure?

**Question**: What to do if session creation fails?

**Answer**: 手动重试

**Decision**:
- Display error message immediately
- Show "Retry" button to user
- Do not auto-retry (avoid infinite loops)
- Mark operation as FAILED

**Impact**:
- Add error handling in createSession()
- Display user-friendly error with retry option
- Update operation status to FAILED

---

### 4.2 Chunk Processing Failure ✅

**Issue**: For large notes with chunking, what if one chunk fails?

**Question**: How to handle partial chunk failure?

**Answer**: 全部失败

**Decision**:
- If any chunk fails, entire operation fails
- Do not show partial results
- Display error message with retry option
- Ensures consistency and completeness

**Impact**:
- Add all-or-nothing logic to chunk processing
- Rollback any partial results on failure
- Clear error messaging about failure

---

### 4.3 Concurrent Operations ✅

**Issue**: User triggers new operation while one is in progress.

**Question**: How to handle concurrent operations?

**Answer**: 加入队列（推荐）

**Decision**:
- Add new operation to queue
- Wait for current operation to complete
- Process operations sequentially (FIFO)
- Show queue position in banner notification

**Impact**:
- Confirm queue-based approach is correct
- No changes needed to existing queue design
- Ensure UI shows queue status clearly

---

### 4.4 Empty Response Handling ✅

**Issue**: OpenCode returns empty suggestions list (e.g., no tasks found).

**Question**: How to handle empty response?

**Answer**: 友好提示

**Decision**:
- Display friendly message: "No suggestions found"
- Operation-specific messages:
  - Summarize: "Note is too short to summarize"
  - Extract tasks: "No tasks found in this note"
  - Improve structure: "Note structure looks good"
  - Suggest links: "No related notes found"
- Mark operation as COMPLETED (not FAILED)

**Impact**:
- Add empty response handling in each command
- Display appropriate user-friendly messages
- Distinguish between empty results and errors

---
