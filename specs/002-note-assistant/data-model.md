# Phase 1: Data Model - Note Assistant Plugin

**Date**: 2026-01-23
**Purpose**: Define core data structures and their relationships

## Core Entities

### 1. Operation Request

Represents a user-initiated AI operation on note content.

```typescript
interface OperationRequest {
  id: string;                    // Unique operation ID (UUID)
  type: OperationType;           // Operation type
  content: string;               // Note content or selection
  notePath: string;              // Path to the note in vault
  timestamp: number;             // Request timestamp (ms)
  status: OperationStatus;       // Current status
  sessionId?: string;            // OpenCode session ID (if created)
}

enum OperationType {
  SUMMARIZE = "summarize",
  EXTRACT_TASKS = "extract_tasks",
  IMPROVE_STRUCTURE = "improve_structure",
  SUGGEST_LINKS = "suggest_links"
}

enum OperationStatus {
  QUEUED = "queued",
  PROCESSING = "processing",
  COMPLETED = "completed",
  FAILED = "failed",
  CANCELLED = "cancelled"
}
```

**Relationships**:
- One OperationRequest → Many Suggestions (via OperationResult)
- One OperationRequest → One OperationResult

---

### 2. Operation Result

Contains AI-generated suggestions from OpenCode API.

```typescript
interface OperationResult {
  operationId: string;           // Reference to OperationRequest
  suggestions: Suggestion[];     // Array of suggestions
  sessionId: string;             // Session ID from OpenCode
  timestamp: number;             // Response timestamp (ms)
  error?: OperationError;        // Error details if failed
}

interface Suggestion {
  id: string;                    // Unique suggestion ID
  type: string;                  // Suggestion type (operation-specific)
  content: string;               // Suggested content
  position?: Position;           // Target position in note
  explanation?: string;          // Why this suggestion was made
  confidence?: number;           // Confidence score (0-1)
}

interface Position {
  line: number;                  // Line number (0-indexed)
  ch: number;                    // Character offset (0-indexed)
}

interface OperationError {
  code: ErrorCode;
  message: string;
  details?: string;
}

enum ErrorCode {
  CONNECTION_REFUSED = "connection_refused",
  TIMEOUT = "timeout",
  INVALID_RESPONSE = "invalid_response",
  SERVICE_ERROR = "service_error"
}
```

**Relationships**:
- One OperationResult → Many Suggestions
- One OperationResult → One OperationRequest

---

### 3. Preview State

Manages the state of inline annotations and user decisions.

```typescript
interface PreviewState {
  operationId: string;           // Reference to OperationRequest
  annotations: Annotation[];     // Active annotations in editor
  decisions: Map<string, Decision>; // User decisions per suggestion
  currentSuggestionIndex: number; // Current suggestion being displayed (for sequential display)
}

interface Annotation {
  suggestionId: string;          // Reference to Suggestion
  widget: AnnotationWidget;      // CodeMirror widget instance
  position: Position;            // Current position in editor
  visible: boolean;              // Visibility state
}

interface Decision {
  suggestionId: string;
  action: DecisionAction;
  editedContent?: string;        // If user edited before accepting
  timestamp: number;
}

enum DecisionAction {
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  EDITED = "edited"
}
```

**Relationships**:
- One PreviewState → Many Annotations
- One PreviewState → One OperationRequest
- One Annotation → One Suggestion

---

### 4. Note Context

Captures the context of the note being processed.

```typescript
interface NoteContext {
  path: string;                  // Full path in vault
  basename: string;              // Note filename without extension
  content: string;               // Full note content
  selection?: TextSelection;     // Selected text (if any)
  metadata?: NoteMetadata;       // Optional metadata
}

interface TextSelection {
  text: string;                  // Selected text
  from: Position;                // Start position
  to: Position;                  // End position
}

interface NoteMetadata {
  wordCount: number;
  headings: string[];            // List of heading texts
  tags: string[];                // Obsidian tags
}
```

**Relationships**:
- One NoteContext → One OperationRequest

---

### 5. Operation Queue

Manages sequential processing of operations.

```typescript
interface OperationQueue {
  queue: QueuedOperation[];      // Pending operations
  current: QueuedOperation | null; // Currently processing
  processing: boolean;           // Processing state
}

interface QueuedOperation {
  request: OperationRequest;     // Operation to execute
  priority: number;              // Priority (lower = higher priority)
  enqueueTime: number;           // When added to queue
  abortController: AbortController; // For cancellation support
}
```

**Relationships**:
- One OperationQueue → Many QueuedOperations
- One QueuedOperation → One OperationRequest

---

### 6. Plugin Settings

User-configurable plugin settings.

```typescript
interface NoteAssistantSettings {
  opencodeEndpoint: string;      // OpenCode service URL
  timeout: number;               // Request timeout (ms)
  showConfidence: boolean;       // Show confidence scores
}
```

---

## Data Flow Diagram

```
User Command
    ↓
OperationRequest (created)
    ↓
OperationQueue (enqueued)
    ↓
OpenCode API (HTTP request with NoteContext)
    ↓
OperationResult (received)
    ↓
PreviewState (annotations created)
    ↓
User Decision (accept/reject/edit)
    ↓
Editor Update (content modified)
```

---

## Entity Relationships

```
OperationQueue (1) ──< (N) QueuedOperation
QueuedOperation (N) ──> (1) OperationRequest
OperationRequest (1) ──> (1) NoteContext
OperationRequest (1) ──< (1) OperationResult
OperationResult (1) ──< (N) Suggestion
PreviewState (1) ──< (N) Annotation
Annotation (N) ──> (1) Suggestion
PreviewState (1) ──> (1) OperationRequest
```

---

## State Transitions

### OperationRequest Status Flow
```
QUEUED → PROCESSING → COMPLETED
                   → FAILED
                   → CANCELLED
```

### Annotation Lifecycle
```
Created (visible=true)
    ↓
User interacts (accept/reject/edit)
    ↓
Decision recorded
    ↓
Removed (visible=false)
```

---

**Data Model Complete** - All entities, relationships, and state transitions defined.
