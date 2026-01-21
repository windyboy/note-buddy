# Data Model: Opencode Client

**Feature**: Opencode Client Interface | **Date**: 2025-01-21

## Overview

This document defines the data models, their relationships, validation rules, and state transitions for the Opencode client plugin.

---

## Core Entities

### Session

Represents a conversation session with Opencode for a specific vault.

```typescript
interface Session {
  id: string;                    // UUID
  vault: string;                 // Vault path/name
  createdAt: number;             // Unix timestamp
  updatedAt: number;             // Unix timestamp
  messages: Message[];           // Conversation history
  metadata?: SessionMetadata;    // Optional metadata
}

interface SessionMetadata {
  vaultPath: string;             // Absolute path to vault
  noteCount: number;             // Number of notes indexed
  lastIndexed: number;           // Last indexing timestamp
}
```

**Validation Rules**:
- `id` must be a valid UUID v4ver 4
- `vault` cannot be empty
- `createdAt` ≤ `updatedAt`
- `messages` array is ordered chronologically

**State Transitions**:
- `created` → `active`: Session created and ready for queries
- `active` → `archived`: Session archived but not deleted
- `archived` → `active`: Session reactivated
- `active` → `deleted`: Session permanently removed

---

### Message

Represents a single message in the conversation.

```typescript
interface Message {
  id: string;                    // UUID
  role: 'user' | 'assistant';    // Message role
  content: string;               // Message text
  timestamp: number;             // Unix timestamp
  referencedNoteIds?: string[];  // IDs of referenced notes (assistant only)
  metadata?: MessageMetadata;    // Additional metadata
}

interface MessageMetadata {
  processingTime?: number;       // Time taken to process (ms)
  noteCount?: number;            // Number of notes referenced
  model?: string;                // AI model used (assistant only)
}
```

**Validation Rules**:
- `id` must be a valid UUID
- `content` cannot be empty
- `content` max length: 10,000 characters
- `referencedNoteIds` only valid for `role: 'assistant'`

---

### Note

Represents a markdown note extracted from the Obsidian vault.

```typescript
interface Note {
  id: string;                    // Note path (relative to vault)
  title: string;                 // Note title (first heading or filename)
  path: string;                  // Full path relative to vault root
  content: string;               // Full markdown content
  tags: string[];                // Obsidian tags
  frontmatter?: NoteFrontmatter; // YAML frontmatter data
  created: number;               // Creation timestamp
  modified: number;              // Last modified timestamp
  size: number;                  // File size in bytes
}

interface NoteFrontmatter {
  [key: string]: unknown;        // Arbitrary frontmatter fields
}
```

**Validation Rules**:
- `id` must be a valid file path
- `path` must be relative to vault root
- `title` cannot be empty
- `tags` array cannot contain empty strings

---

### Query

Represents a user query sent to Opencode.

```typescript
interface Query {
  prompt: string;                // User's question/prompt
  vault: Note[];                 // Vault notes (for context)
  sessionContext?: Message[];    // Previous messages for context
  options?: QueryOptions;        // Optional query options
}

interface QueryOptions {
  maxNotes?: number;             // Maximum notes to include (default: 100)
  maxContextLength?: number;     // Maximum context characters (default: 10000)
  includeFrontmatter?: boolean;  // Include frontmatter in context (default: false)
}
```

**Validation Rules**:
- `prompt` cannot be empty
- `prompt` max length: 10,000 characters
- `vault` array cannot be empty
- `maxNotes` must be between 1 and 1000 (if specified)

---

### QueryResponse

Represents Opencode's response to a query.

```typescript
interface QueryResponse {
  content: string;                // Response text
  referencedNotes: ReferencedNote[];  // Notes referenced in response
  suggestions?: Suggestion[];     // Organization suggestions
  metadata?: ResponseMetadata;    // Response metadata
}

interface ReferencedNote {
  id: string;                     // Note ID
  relevanceScore?: number;        // Relevance score (0-1)
  excerpt?: string;               // Relevant excerpt
}

interface Suggestion {
  type: 'merge' | 'split' | 'rename' | 'tag';  // Suggestion type
  sourceNoteId: string;          // Note to operate on
  targetNoteId?: string;         // Target note (for merge)
  reason: string;                 // Explanation of suggestion
  confidence: number;             // Confidence score (0-1)
}

interface ResponseMetadata {
  model: string;                  // AI model used
  processingTime: number;         // Time taken (ms)
  noteCount: number;              // Notes processed
}
```

**Validation Rules**:
- `content` cannot be empty
- `confidence` must be between 0 and 1
- `type` must be one of the allowed values

---

### Settings

Represents plugin configuration.

```typescript
interface PluginSettings {
  opencodeUrl: string;            // Opencode server URL
  timeout: number;                // Request timeout (ms)
  debugMode: boolean;             // Enable debug logging
  maxSessions: number;            // Maximum sessions to keep
  autoArchiveDays: number;        // Auto-archive sessions older than X days
}

const DEFAULT_SETTINGS: PluginSettings = {
  opencodeUrl: 'http://localhost:8000',
  timeout: 30000,
  debugMode: false,
  maxSessions: 10,
  autoArchiveDays: 30
};
```

**Validation Rules**:
- `opencodeUrl` must be valid HTTPS URL
- `timeout` must be between 1000 and 60000
- `maxSessions` must be between 1 and 100
- `autoArchiveDays` must be ≥ 0

---

## Relationships

```
Session (1) ─── (N) Message
Session (1) ─── (1) Vault (via metadata)
Message (N) ─── (M) Note (via referencedNoteIds)
Query (1) ─── (N) Note (vault context)
QueryResponse (1) ─── (M) Note (referencedNotes)
QueryResponse (1) ─── (N) Suggestion
```

---

## State Management

### Plugin State

```typescript
interface PluginState {
  sessions: Session[];           // All active sessions
  currentSessionId?: string;      // Currently active session
  vaults: Map<string, Note[]>;   // Cached vault notes by path
  settings: PluginSettings;       // Plugin settings
}
```

**State Transitions**:

1. **Session Creation**
   - New session added to `sessions` array
   - `currentSessionId` updated if first session

2. **Session Deletion**
   - Session removed from `sessions` array
   - `currentSessionId` updated if deleted session was active

3. **Message Addition**
   - New message appended to session's `messages` array
   - Session's `updatedAt` updated
   - Plugin state persisted

4. **Vault Cache Update**
   - Notes added/updated in `vaults` map
   - Session metadata updated with note count and indexing time

---

## Data Persistence

### Storage Layers

1. **Plugin Data API**
   - Stores `PluginState` (sessions, settings)
   - Automatically persisted by Obsidian
   - Survives plugin reload

2. **In-Memory Cache**
   - Stores vault notes during session
   - Cleared on plugin unload
   - Provides fast access for queries

3. **Vault Filesystem**
   - Notes stored as markdown files
   - Read via Obsidian Vault API
   - Managed by Obsidian, not plugin

### Persistence Strategy

```typescript
class StateManager {
  // Load state from plugin data
  async loadState(): Promise<PluginState> {
    const saved = await this.plugin.loadData();
    return {
      sessions: saved?.sessions || [],
      currentSessionId: saved?.currentSessionId,
      vaults: new Map(),
      settings: { ...DEFAULT_SETTINGS, ...saved?.settings }
    };
  }

  // Save state to plugin data (debounced)
  private saveState = debounce(async (): Promise<void> => {
    await this.plugin.saveData({
      sessions: this.state.sessions,
      currentSessionId: this.state.currentSessionId,
      settings: this.state.settings
    });
  }, 500);
}
```

---

## Data Flow

### Query Flow

1. User submits query prompt
2. Vault notes loaded/cached
3. Query object constructed with context
4. Query sent to Opencode via HTTP
5. QueryResponse received
6. User message created and added to session
7. Assistant message created with response
8. Session state persisted

### Session Management Flow

1. User creates new session
2. Vault path determined from Obsidian
3. Vault notes indexed and cached
4. Session created with metadata
5. Session added to state
6. State persisted

---

## Type Utilities

```typescript
// UUID v4 generator
function generateId(): string {
  return crypto.randomUUID();
}

// Validation utilities
class Validators {
  static isValidUuid(id: string): boolean {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
  }

  static sanitizePrompt(prompt: string): string {
    return prompt.trim().slice(0, 10000);
  }

  static isValidHttpsUrl(url: string): boolean {
    try {
      const parsed = new URL(url);
      return parsed.protocol === 'https:';
    } catch {
      return false;
    }
  }
}
```

---

## Summary

The data model defines:

- **5 core entities**: Session, Message, Note, Query, QueryResponse
- **3 supporting entities**: Settings, PluginState, ReferencedNote, Suggestion
- **Clear validation rules** for all entities
- **State transitions** for lifecycle management
- **3-layer persistence strategy**: Plugin Data, in-memory cache, filesystem
- **Typed TypeScript interfaces** with strict validation
- **Utility functions** for ID generation and validation

All models support the feature requirements and constitution constraints.
