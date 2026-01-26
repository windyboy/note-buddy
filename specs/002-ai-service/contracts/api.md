# API Contracts: AI Service Integration

> **Feature**: 002-ai-service
> **Purpose**: Define API contracts for opencode service connection and messaging
> **Note**: Updated to match actual opencode serve API (v0.0.3)

---

## Overview

This document defines the HTTP API contracts for interacting with the local opencode serve (http://127.0.0.1:4096). The Note Buddy plugin acts as an HTTP client to these endpoints.

**Service Version**: OpenCode API v0.0.3
**OpenAPI Spec**: http://127.0.0.1:4096/doc

---

## Base URL

The service URL is configurable via plugin settings.

**Default**: `http://127.0.0.1:4096`

---

## Authentication

**NO AUTHENTICATION REQUIRED**

The opencode serve API does not require authentication. All endpoints are publicly accessible.

**Removed**: HTTP Basic Authentication (username/password) - NOT supported by opencode serve

**Updated Settings**:
- **Service URL**: Required (http://127.0.0.1:4096)
- **Username**: NOT USED (removed from settings)
- **Password**: NOT USED (removed from settings)

---

## Endpoints

### 1. Health Check

**Purpose**: Verify service is running and accessible

**Method**: `GET`

**Path**: `/global/health`

**Request Headers**: None (no authentication)

**Request Body**: None

**Success Response (200 OK)**:
```json
{
  "healthy": true,
  "version": "0.0.3"
}
```

**Error Responses**:

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 503 Service Unavailable | Service unhealthy | `{"error": "Service unavailable"}` |
| Other (4xx/5xx) | Other errors | `{"error": "Error message"}` |

**Timeout**: 10 seconds

**Implementation Notes**:
- Plugin sends GET request to `/global/health`
- Only 200 OK status with `"healthy": true` is successful
- Response includes version info
- Timeout treated as connection failure

---

### 2. Create Session

**Purpose**: Create a new opencode session for conversation

**Method**: `POST`

**Path**: `/session`

**Query Parameters** (optional):
- `directory` (string): Project directory path

**Request Headers**: None (no authentication)

**Request Body** (optional):
```json
{
  "parentID": "ses...",
  "title": "My Chat Session",
  "permission": {
    "rules": [
      {
        "path": "/absolute/path/*",
        "access": "read"
      }
    ]
  }
}
```

**Constraints**:
- `parentID`: Optional, pattern `^ses.*` (for forking existing session)
- `title`: Optional, session title
- `permission`: Optional, file permission rules

**Success Response (200 OK)**:
```json
{
  "sessionID": "sesabc123...",
  "title": "My Chat Session",
  "directory": "/path/to/project",
  "parentID": null,
  "createTime": 1706248800000,
  "updateTime": 1706248800000,
  "permission": {...},
  "lastMessageID": "msg..."
}
```

**Error Responses**:

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 400 Bad Request | Invalid request body | `{"error": "Invalid session format"}` |
| Other (4xx/5xx) | Other errors | `{"error": "Error message"}` |

**Timeout**: 10 seconds

**Implementation Notes**:
- Plugin creates session on first message send
- Store `sessionID` for subsequent messages
- `directory` can be set to current Obsidian vault path
- Session persists across plugin reloads

---

### 3. Send Message

**Purpose**: Send user message to AI service and receive response

**Method**: `POST`

**Path**: `/session/{sessionID}/message`

**Path Parameters**:
- `sessionID` (string): Session ID from session creation

**Request Headers**: None (no authentication)

**Request Body**:
```json
{
  "parts": [
    {
      "text": "Hello, how can you help me today?",
      "role": "user"
    }
  ],
  "model": {
    "providerID": "anthropic",
    "modelID": "claude-sonnet-4-20250514"
  },
  "agent": "opencode",
  "system": "You are a helpful assistant."
}
```

**Constraints**:
- `parts`: Required, array of message parts
  - `text`: Required, message text
  - `role`: Required, `"user"` or `"assistant"` or `"system"`
- `model`: Optional, model selection
  - `providerID`: Required if model specified (e.g., "anthropic")
  - `modelID`: Required if model specified (e.g., "claude-sonnet-4-20250514")
- `agent`: Optional, agent name (default: "opencode")
- `system`: Optional, system prompt
- `noReply`: Optional, boolean (if true, no AI response)
- `variant`: Optional, variant identifier

**Success Response (200 OK)**:
```json
{
  "info": {
    "messageID": "msgabc123...",
    "sessionID": "sesabc123...",
    "role": "assistant",
    "createTime": 1706248800000,
    "model": {
      "providerID": "anthropic",
      "modelID": "claude-sonnet-4-20250514"
    }
  },
  "parts": [
    {
      "text": "I'd be happy to help you! What would you like to know?",
      "role": "assistant"
    }
  ]
}
```

**Alternative Success Response (200 OK)** - Multi-part response:
```json
{
  "info": {
    "messageID": "msgabc123...",
    "sessionID": "sesabc123...",
    "role": "assistant",
    "createTime": 1706248800000
  },
  "parts": [
    {
      "text": "Here's my first thought.",
      "role": "assistant"
    },
    {
      "text": "And here's more detail.",
      "role": "assistant"
    }
  ]
}
```

**Error Responses**:

| Status Code | Description | Response Body |
|-------------|-------------|---------------|
| 400 Bad Request | Invalid request body | `{"error": "Invalid message format"}` |
| 404 Not Found | Session not found | `{"error": "Session not found"}` |
| Other (4xx/5xx) | Other errors | `{"error": "Error message"}` |

**Timeout**: 10 seconds

**Implementation Notes**:
- Plugin sends POST request with JSON body
- Only 200 OK status is successful
- `info.messageID` provides message ID
- `parts` array contains AI response (may have multiple parts)
- `parts[].text` contains the AI reply text
- Extract all `parts[].text` where `role === "assistant"`
- Join multiple assistant parts with newline
- Any non-200 status treated as send failure
- Timeout treated as send failure

---

### 4. List Sessions (Optional)

**Purpose**: List all opencode sessions

**Method**: `GET`

**Path**: `/session`

**Query Parameters** (optional):
- `directory` (string): Filter by project directory
- `roots` (boolean): Only return root sessions (no parentID)
- `start` (number): Filter by timestamp (milliseconds since epoch)
- `search` (string): Filter by title (case-insensitive)
- `limit` (number): Maximum number of sessions to return

**Request Headers**: None (no authentication)

**Request Body**: None

**Success Response (200 OK)**:
```json
[
  {
    "sessionID": "sesabc123...",
    "title": "My Chat Session",
    "directory": "/path/to/project",
    "parentID": null,
    "createTime": 1706248800000,
    "updateTime": 1706248800000,
    "permission": {...},
    "lastMessageID": "msg..."
  }
]
```

**Implementation Notes**:
- Optional endpoint for session management
- Not required for MVP (user stories don't specify)
- Can be used for session browser UI in future

---

## Error Handling

### Connection Errors

**Scenarios**:
1. Service URL invalid/unreachable
2. Service not running (connection refused)
3. Timeout (service hung)

**Plugin Behavior**:
- Display toast notification: "Failed to connect to opencode service"
- Update connection state to `Disconnected`
- Store error message in `ConnectionState.lastError`
- Log error to console for debugging

**User Feedback**:
- Toast notification: Obsidian Notice API
- Connection status indicator in settings
- Error message in connection test result

---

### Message Send Errors

**Scenarios**:
1. Service unavailable
2. Invalid request format
3. Session not found (404)
4. Timeout
5. Internal service error

**Plugin Behavior**:
- Display toast notification: "Failed to send message: [error]"
- Update message: state to `Error`
- Store error message in `MessageState.error`
- Log error to console for debugging
- Allow user to retry

**User Feedback**:
- Toast notification: Obsidian Notice API
- Error message in chat view
- Re-enable send button for retry

---

## Request Constraints

### Rate Limiting

**Plugin Behavior**:
- In-flight message guard prevents concurrent sends
- Only one message at a time (UI block)
- User must wait for response before sending next

**Service Constraints**:
- Service may implement rate limiting (unknown)
- Plugin does not retry on rate limit errors (user manual retry)

---

### Request Timeout

**All requests**: 10 seconds

**Behavior**:
- Timeout treated as failure
- No automatic retry
- User can manually retry

---

## OpenAPI Specification (Reference)

**Full OpenAPI 3.1.1 specification**: http://127.0.0.1:4096/doc

**Key endpoints used**:
- `GET /global/health` - Health check
- `POST /session` - Create session
- `POST /session/{sessionID}/message` - Send message
- `GET /session` - List sessions (optional)

**No authentication required** - All endpoints are public

---

## Testing

### Manual Testing

Use `curl` to test endpoints during development:

**Health Check**:
```bash
curl http://127.0.0.1:4096/global/health
```

**Expected Response**:
```json
{
  "healthy": true,
  "version": "0.0.3"
}
```

**Create Session**:
```bash
curl -X POST http://127.0.0.1:4096/session
```

**Expected Response**:
```json
{
  "sessionID": "sesabc123...",
  "title": null,
  "directory": null,
  "parentID": null,
  "createTime": 1706248800000,
  "updateTime": 1706248800000
}
```

**Send Message** (replace `sesabc123` with actual session ID):
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "parts": [
      {
        "text": "Hello, how are you?",
        "role": "user"
      }
    ]
  }' \
  http://127.0.0.1:4096/session/sesabc123/message
```

**Expected Response**:
```json
{
  "info": {
    "messageID": "msgabc123...",
    "sessionID": "sesabc123...",
    "role": "assistant",
    "createTime": 1706248800000
  },
  "parts": [
    {
      "text": "I'm doing well! How can I help you today?",
      "role": "assistant"
    }
  ]
}
```

**List Sessions**:
```bash
curl http://127.0.0.1:4096/session
```

**Test Timeout**:
```bash
# Timeout after 10s
curl -m 10 http://127.0.0.1:4096/global/health
```

---

## Summary

| Endpoint | Method | Auth | Body | Timeout | Use Case |
|----------|--------|:----:|:----:|:-------:|----------|
| `/global/health` | GET | None | None | 10s | Health check |
| `/session` | POST | None | JSON (optional) | 10s | Create session |
| `/session/{id}/message` | POST | None | JSON (required) | 10s | Send message |
| `/session` | GET | None | None | 10s | List sessions (optional) |

**Total Endpoints**: 3 core (health, create session, send message) + 1 optional (list sessions)

**Authentication**: None (public endpoints)

**Timeout**: 10 seconds for all requests

**Error Handling**: All non-200 responses treated as failures

**Key Changes from Original Contract**:
1. ✅ Removed HTTP Basic Auth (not supported)
2. ✅ Updated health endpoint to `/global/health`
3. ✅ Added session creation (`POST /session`)
4. ✅ Updated message endpoint to `/session/{sessionID}/message`
5. ✅ Updated message format to use `parts` array
6. ✅ Updated response format to extract `parts[].text`
7. ✅ Removed username/password from settings
