# Research Research: AI Service Integration

> **Feature**: 002-ai-service
> **Purpose**: Document technical decisions and research for connecting Note Buddy plugin to local opencode serve
> **Note**: Updated to match actual opencode serve API (v0.0.3)

---

## Decisions

### 1. HTTP Client Selection

**Decision**: Use Obsidian's `requestUrl` API (built-in to Electron)

**Rationale**:
- No external dependencies required
- Native support in Obsidian plugin API
- Proper timeout support via options
- Cross-platform compatibility

**Alternatives considered**:
- `fetch` API: Not available in Node.js/Electron context without polyfills
- `axios`: External dependency, adds bundle size
- `superagent`: External dependency, maintenance concerns

---

### 2. Authentication Strategy

**Decision**: No Authentication Required

**Rationale**:
- opencode serve API does NOT require authentication
- All endpoints are publicly accessible
- Simplifies implementation
- No security concerns for local development use case

**Alternatives considered**:
- HTTP Basic Auth: NOT supported by opencode serve API
- API keys: Overkill for local service
- OAuth: Overkill for local development use case

---

### 3. Request Timeout Value

**Decision**: 10 seconds for health checks and message sending

**Rationale**:
- Local service should respond quickly (< 1s normally)
- 10s provides ample margin for slow local processing
- Prevents UI freezing or indefinite waiting
- Clear user feedback when service is unresponsive

**Alternatives considered**:
- 5s: Too aggressive, might timeout on slow local processing
- 30s: Too long, poor UX when service is down
- No timeout: Risk of UI hanging indefinitely

---

### 4. Message Format

**Decision**: Non-streaming JSON messages with `parts` array

**Rationale**:
- Matches opencode serve API format
- Obsidian's `requestUrl` naturally handles JSON
- Easier error handling (complete response or failure)
- Multi-part responses supported

**Alternatives considered**:
- Streaming: Added complexity, not required for MVP
- Plain text: Less extensible for future features

---

### 5. In-Flight Message Guard

**Decision**: Prevent multiple simultaneous message sends

**Rationale**:
- Prevents race conditions with UI state
- Ensures proper message ordering
- Avoids overwhelming local service
- Simpler UI feedback management

**Alternatives considered**:
- Queue all messages: More complex, not required
- Allow concurrent: Risk of UI state corruption

---

### 6. Error Handling Strategy

**Decision**: Graceful degradation with user feedback

**Rationale**:
- Obsidian's Notice API for toasts
- Clear error messages for common failures
- Console logging for debugging
- Never crash plugin on network errors

**Alternatives considered**:
- Silent failures: Poor UX
- Throw errors: Risk of plugin instability

---

### 7. Service URL Default

**Decision**: `http://127.0.0.1:4096`

**Rationale**:
- Standard localhost address
- Port 4096 is opencode serve default
- Matches expected local service configuration

**Alternatives considered**:
- `localhost`: Same as 127.0.0.1 but less explicit
- Custom port: Risk of conflicts with other services

---

### 8. Session Management

**Decision**: Create session on first message send, persist session ID

**Rationale**:
- opencode serve requires session for messaging
- Session created via `POST /session`
- Session ID required for `POST /session/{id}/message`
- Persist session ID for subsequent messages

**Alternatives considered**:
- Create session on plugin load: Unnecessary if user never sends message
- Create session per message: Inefficient, loses conversation context
- No session management: Not possible (opencode API requires sessions)

---

### 9. Testing Approach

**Decision**: Manual testing with explicit test scenarios

**Rationale**:
- Network integration testing requires real service
- User stories specify manual verification steps
- No automated test framework specified in tech stack
- Quickstart.md will document verification flow

**Alternatives considered**:
- Unit tests with mocks: Would require mock service setup
- Integration tests: Would require running opencode serve

---

## Technical Details

### Obsidian requestUrl API

```typescript
interface UrlRequestOptions {
    url: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS';
    headers?: Record<string, string>;
    body?: string | Record<string, unknown>;
    contentType?: string;
    throw?: boolean;
    timeout?: number;
}

interface UrlRequestResponse {
    status: number;
    headers: Record<string, string>;
    text: string;
    json: unknown;
}
```

**Key capabilities used**:
- `method: 'GET'` for health check
- `method: 'POST'` for session creation and message sending
- `timeout: 10000` for 10s timeout
- `json` property for parsing JSON responses
- `status` for error handling

---

### Health Check Endpoint

**Endpoint**: `GET /global/health`

**Success criteria**:
- HTTP 200 status
- Response includes `"healthy": true`
- Response includes `"version"` string
- Returns within 10s timeout

**Failure modes**:
- Connection refused (service not running)
- Timeout (service hanging)
- 4xx/5xx status (service error)

---

### Session Creation Endpoint

**Endpoint**: `POST /session`

**Request format**:
```json
{
  "parentID": null,
  "title": "Note Buddy",
  "directory": "/path/to/vault"
}
```

**Success criteria**:
- HTTP 200 status
- Response includes `"sessionID"` (starts with "ses")
- Response includes `"createTime"` timestamp

**Failure modes**:
- Service unavailable
- Invalid request format

---

### Message Sending Endpoint

**Endpoint**: `POST /session/{sessionID}/message`

**Request format**:
```json
{
  "parts": [
    {
      "text": "user message text",
      "role": "user"
    }
  ]
}
```

**Success criteria**:
- HTTP 200 status
- Response includes `"info.messageID"` (starts with "msg")
- Response includes `"parts"` array
- Extract all `parts[].text` where `role === "assistant"`

**Failure modes**:
- Service unavailable
- Invalid request format
- Session not found (404)
- Timeout
- Internal service error

---

## Open Questions and Assumptions

### Assumptions

1. opencode serve runs on `http://127.0.0.1:4096` by default
2. opencode serve does NOT require authentication (verified via API spec)
3. Health check endpoint is `/global/health`
4. Session creation endpoint is `POST /session`
5. Message endpoint is `POST /session/{sessionID}/message`
6. Session ID persists for conversation context
7. Response format uses `parts` array

### Open Questions (Resolved)

1. **Should we use streaming messages?**
   - Resolved: No, non-streaming for MVP simplicity

2. **What timeout value?**
   - Resolved: 10 seconds

3. **How to handle concurrent sends?**
   - Resolved: Block with in-flight guard

4. **Default service URL?**
   - Resolved: http://127.0.0.1:4096

5. **Testing approach?**
   - Resolved: Manual testing with explicit scenarios

6. **Authentication?**
   - Resolved: None required (not supported by opencode API)

7. **Session management?**
   - Resolved: Create on first send, persist session ID

---

## References

- [Obsidian API Documentation - requestUrl](https://docs.obsidian.md/Reference/TypeScript+API/requestUrl)
- [opencode serve API](http://127.0.0.1:4096/doc)
- [Obsidian Plugin Development](https://docs.obsidian.md/Plugins/Getting+started/Build+a+plugin)
