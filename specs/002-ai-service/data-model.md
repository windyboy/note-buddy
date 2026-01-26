# Data Model: AI Service Integration

> **Feature**: 002-ai-service
> **Purpose**: Define data structures for service settings, connection state, and messaging
> **Note**: Updated to match actual opencode serve API (v0.0.3)

---

## Overview

This feature uses in-memory models only (no persistence). Service settings are stored in Obsidian's plugin settings system, and connection state is ephemeral UI state.

---

## Service Settings

### ServiceSettings

**Purpose**: Configuration for connecting to local opencode serve

**Location**: Stored in Obsidian plugin settings (`plugin.loadData()`, `plugin.saveData()`)

```typescript
interface ServiceSettings {
    /** 
     * Service URL for opencode serve
     * Default: http://127.0.0.1:4096
     */
    serviceUrl: string;
}
```

**Constraints**:
- `serviceUrl`: Must be valid HTTP/HTTPS URL format
- `serviceUrl`: Must include hostname and port

**Default Values**:
```typescript
const defaultSettings: ServiceSettings = {
    serviceUrl: 'http://127.0.0.1:4096'
};
```

**Validation Rules**:
1. `serviceUrl` must start with `http://` or `https://`
2. `serviceUrl` must include hostname (not just protocol)
3. `serviceUrl` must include port number

**Changes from Original**:
- ✅ Removed `username` (no authentication required)
- ✅ Removed `password` (no authentication required)

---

## Connection State

### ConnectionState

**Purpose**: Ephemeral state tracking for service connection status

**Location**: In-memory state in plugin instance

```typescript
enum ConnectionStatus {
    /** Connection has not been tested */
    Unknown = 'unknown',
    
    /** Connection test successful */
    Connected = 'connected',
    
    /** Connection test failed */
    Disconnected = 'disconnected',
    
    /** Connection test in progress */
    Testing = 'testing'
}

interface ConnectionState {
    /** Current connection status */
    status: ConnectionStatus;
    
    /** Timestamp of last connection test (Unix epoch ms) */
    lastTestTime?: number;
    
    /** Error message from last failed connection test */
    lastError?: string;
}
```

**State Transitions**:
```
Unknown → Testing → Connected
Unknown → Testing → Disconnected
Connected → Testing → Connected (re-test)
Connected → Testing → Disconnected
Disconnected → Testing → Connected
Disconnected → Testing → Disconnected (re-test)
```

**Constraints**:
- Only one connection test at a time
- `lastTestTime` is set only when `status` is `Connected` or `Disconnected`
- `lastError` is set only when `status` is `Disconnected`

---

## Session State

### SessionState

**Purpose**: Track active opencode session for conversation

**Location**: In-memory state in plugin instance

```typescript
interface SessionState {
    /** Session ID from opencode serve (starts with "ses") */
    sessionID: string;
    
    /** Session timestamp (creation time) */
    createTime: number;
    
    /** Optional session title */
    title?: string;
}
```

**Constraints**:
- `sessionID`: Non-empty string, starts with "ses"
- `createTime`: Unix epoch timestamp (milliseconds)
- `title`: Optional, user-friendly session name

**Lifecycle**:
- Created on first message send (via `POST /session`)
- Persisted across message sends
- Can be recreated if becomes invalid (404 error)

---

## Message Types

### SendMessage

**Purpose**: User message payload sent to AI service

```typescript
interface MessagePart {
    /** Message text content */
    text: string;
    
    /** Role: user, assistant, or system */
    role: 'user' | 'assistant' | 'system';
}

interface SendMessage {
    /** Array of message parts (typically one user part) */
    parts: MessagePart[];
    
    /** Optional model selection */
    model?: {
        providerID: string;
        modelID: string;
    };
    
    /** Optional agent name */
    agent?: string;
    
    /** Optional system prompt */
    system?: string;
}
```

**Constraints**:
- `parts`: Non-empty array
- `parts[].text`: Non-empty string
- `parts[].role`: Required ("user" for user messages)
- `model`: Optional, defaults to opencode default
- `agent`: Optional, defaults to "opencode"
- `system`: Optional, custom system prompt

**Changes from Original**:
- ✅ Changed from `{message, username}` to `{parts: [{text, role}]}`
- ✅ Removed `username` (no authentication)
- ✅ Added `parts` array (multi-part messages)

---

### MessageResponse

**Purpose**: AI service response

```typescript
interface MessageInfo {
    /** Message ID from opencode serve (starts with "msg") */
    messageID: string;
    
    /** Session ID */
    sessionID: string;
    
    /** Role: assistant (typically) */
    role: string;
    
    /** Creation timestamp */
    createTime: number;
    
    /** Optional model info */
    model?: {
        providerID: string;
        modelID: string;
    };
}

interface MessageResponse {
    /** Message metadata */
    info: MessageInfo;
    
    /** Array of response parts */
    parts: MessagePart[];
}
```

**Constraints**:
- `info.messageID`: Non-empty string, starts with "msg"
- `info.sessionID`: Non-empty string, matches session ID
- `parts`: Non-empty array
- `parts[].text`: Non-empty string
- `parts[].role`: Typically "assistant"

**Extraction**:
- Extract all `parts[].text` where `role === "assistant"`
- Join multiple assistant parts with newline

**Changes from Original**:
- ✅ Changed from `{reply, metadata?}` to `{info, parts: [{text, role}]}`
- ✅ Added `info.messageID`, `info.sessionID`
- ✅ Added `parts` array (multi-part responses)

---

### MessageState

**Purpose**: Ephemeral state for message sending

**Location**: In-memory state in ChatView component

```typescript
enum MessageStatus {
    /** No message in flight */
    Idle = 'idle',
    
    /** Message sending in progress */
    Sending = 'sending',
    
    /** Message send successful */
    Sent = 'sent',
    
    /** Message send failed */
    Error = 'error'
}

interface MessageState {
    /** Current message status */
    status: MessageStatus;
    
    /** Error message if status is Error */
    error?: string;
    
    /** Timestamp of message send (Unix epoch ms) */
    sendTime?: number;
}
```

**State Transitions**:
```
Idle → Sending → Sent
Idle → Sending → Error
```

**Constraints**:
- Only one message at a time (in-flight guard)
- Cannot send new message while `status` is `Sending`
- `error` set only when `status` is `Error`
- `sendTime` set only when `status` is `Sent` or `Error`

---

## Summary

| Model | Purpose | Persistence | Location |
|-------|---------|--------------|:--------:|
| ServiceSettings | Service configuration | Yes (Obsidian settings) | plugin data |
| ConnectionState | Connection status | No (in-memory) | plugin instance |
| SessionState | Active session | No (in-memory) | plugin instance |
| SendMessage | Message payload | No (ephemeral) | function param |
| MessageResponse | AI response | No (ephemeral) | function return |
| MessageState | Send state | No (in-memory) | ChatView instance |

**Total Entities**: 6 (1 persistent, 5 ephemeral)

**Relationships**:
- `ServiceSettings` → independent (config only)
- `ConnectionState` → independent (tracks connection test)
- `SessionState` → `SendMessage` (provides sessionID for messaging)
- `MessageState` → independent (tracks message send)
- `SendMessage` → `MessageResponse` (request/response pair)

---

## Type Definitions File

**Location**: `src/models.ts`

```typescript
// Service settings (persisted in Obsidian plugin data)
export interface ServiceSettings {
    serviceUrl: string;
}

// Connection state (in-memory)
export enum ConnectionStatus {
    Unknown = 'unknown',
    Connected = 'connected',
    Disconnected = 'disconnected',
    Testing = 'testing'
}

export interface ConnectionState {
    status: ConnectionStatus;
    lastTestTime?: number;
    lastError?: string;
}

// Session state (in-memory)
export interface SessionState {
    sessionID: string;
    createTime: number;
    title?: string;
}

// Message types (ephemeral)
export interface MessagePart {
    text: string;
    role: 'user' | 'assistant' | 'system';
}

export interface SendMessage {
    parts: MessagePart[];
    model?: {
        providerID: string;
        modelID: string;
    };
    agent?: string;
    system?: string;
}

export interface MessageInfo {
    messageID: string;
    sessionID: string;
    role: string;
    createTime: number;
    model?: {
        providerID: string;
        modelID: string;
    };
}

export interface MessageResponse {
    info: MessageInfo;
    parts: MessagePart[];
}

// Message state (in-memory)
export enum MessageStatus {
    Idle = 'idle',
    Sending = 'sending',
    Sent = 'sent',
    Error = 'error'
}

export interface MessageState {
    status: MessageStatus;
    error?: string;
    sendTime?: number;
}
```
