# Quickstart Guide: AI Service Integration

> **Feature**: 002-ai-service
> **Purpose**: Manual verification and testing instructions
> **Note**: Updated to match actual opencode serve API (v0.0.3)

---

## Prerequisites

Before testing the AI service integration, ensure:

- [ ] Obsidian development environment is ready
- [ ] Note Buddy plugin (001-assistant-plugin) is installed and working
- [ ] opencode serve is running locally (http://127.0.0.1:4096)
- [ ] Plugin is enabled in Obsidian settings

---

## Setup Instructions

### 1. Enable Plugin

1. Open Obsidian
2. Go to **Settings** → **Community Plugins**
3. Find "Note Buddy" in the list
4. Click the toggle to enable the plugin
5. Click the "Options" button for Note Buddy

### 2. Configure Service Settings

In Note Buddy plugin options:

1. **Service URL**:
   - Default: `http://127.0.0.1:4096`
   - Change if opencode serve runs on different URL
   - Format: `http://hostname:port` or `https://hostname:port`
   - Must include port number

2. Click **Save** to apply settings

**Note**: No username or password required (opencode serve does not use authentication)

---

## Test Scenarios

### Scenario 1: Service Connection (User Story 2)

**Goal**: Verify plugin can connect to opencode serve

**Steps**:

1. Open Note Buddy chat view (click bot icon in left ribbon)
2. In plugin settings, locate **Test Connection** button
3. Click **Test Connection**
4. Wait for result (max 10 seconds)

**Expected Results**:

**Success Case** (service running):
- Toast notification appears: "Connected to opencode service"
- Status indicator shows "Connected"
- Connection test button shows success state

**Failure Case** (service not running):
- Toast notification appears: "Failed to connect to opencode service: connection refused"
- Status indicator shows "Disconnected"
- Error message displayed
- Can retry by clicking Test Connection again

**Failure Case** (timeout):
- Toast notification appears: "Failed to connect to opencode service: timeout"
- Status indicator shows "Disconnected"
- Verify service is running and retry

**Verification Checklist**:
- [ ] Connection test completes within 10 seconds
- [ ] Success toast appears when service is running
- [ ] Error toast appears with message when connection fails
- [ ] Status indicator updates correctly
- [ ] Can retry connection test after failure

---

### Scenario 2: Send Message (User Story 3)

**Goal**: Verify plugin can send messages to AI service

**Prerequisites**:
- Service connection test passed
- opencode serve is running

**Steps**:

1. Open Note Buddy chat view (click bot icon)
2. In chat view, type message in textarea: "Hello, AI!"
3. Click **Send** button (or press Enter)
4. Wait for response (max 10 seconds)

**Expected Results**:

**Success Case**:
- Send button disabled during send (in-flight guard active)
- Toast notification appears: "Message sent successfully"
- AI response displayed in chat scroll area
- Session created automatically (first message)
- Textarea cleared after send
- Send button re-enabled

**Failure Case** (service unavailable):
- Toast notification appears: "Failed to send message: service unavailable"
- Error message displayed in chat view
- Send button re-enabled
- Can retry by clicking Send again

**Failure Case** (session not found - 404):
- Toast notification appears: "Failed to send message: session not found"
- Error message displayed in chat view
- Send button re-enabled
- Plugin should recreate session and retry

**Failure Case** (timeout):
- Toast notification appears: "Failed to send message: timeout"
- Error message displayed in chat view
- Send button re-enabled
- Verify service is running and retry

**Failure Case** (empty message):
- Send button disabled (no action)
- Toast notification: "Please enter a message"
- Textarea remains with content

**Verification Checklist**:
- [ ] Send button disables during send
- [ ] Message sends within 10 seconds
- [ ] Session created on first message
- [ ] Success toast appears on successful send
- [ ] AI response displayed in chat
- [ ] Textarea cleared after successful send
- [ ] Send button re-enabled after send completes
- [ ] Error toast appears with message on failure
- [ ] Can retry failed sends

---

### Scenario 3: Keyboard Shortcuts

**Goal**: Verify keyboard shortcuts work correctly

**Steps**:

1. Open Note Buddy chat view
2. Type multi-line message:
   ```
   Line 1
   Line 2
   Line 3
   ```
3. Press **Enter** (not Shift+Enter)
4. Type another message
5. Press **Shift+Enter** (creates newline)
6. Type more text, then press **Enter**

**Expected Results**:

**Enter Key**:
- Message sends immediately
- Toast notification appears
- AI response displayed
- Textarea cleared

**Shift+Enter Key**:
- Newline inserted in textarea
- Message does NOT send
- Can continue typing on new line

**Verification Checklist**:
- [ ] Enter sends message
- [ ] Shift+Enter creates newline
- [ ] Can mix Enter and Shift+Enter correctly
- [ ] Message content preserved with newlines

---

### Scenario 4: Settings Persistence

**Goal**: Verify settings persist across plugin reload

**Steps**:

1. Open Note Buddy plugin settings
2. Change **Service URL** to `http://localhost:8080`
3. Click **Save**
4. Disable and re-enable Note Buddy plugin
5. Open plugin settings again

**Expected Results**:

- **Service URL** still shows `http://localhost:8080`

**Verification Checklist**:
- [ ] Service URL persists after plugin reload
- [ ] Settings loaded correctly on plugin enable

---

### Scenario 5: Duplicate View Prevention

**Goal**: Verify only one chat view exists (from US1)

**Steps**:

1. Open Note Buddy chat view (click bot icon)
2. Click bot icon again
3. Observe right sidebar

**Expected Results**:

- No duplicate chat view created
- Existing chat view is focused
- Only one "Note Buddy" tab in right sidebar

**Verification Checklist**:
- [ ] Clicking icon again focuses existing view
- [ ] No duplicate views created
- [ ] Only one tab in right sidebar

---

### Scenario 6: Session Persistence

**Goal**: Verify session persists across message sends

**Prerequisites**:
- opencode serve is running
- Successfully connected to service

**Steps**:

1. Open Note Buddy chat view
2. Send first message: "Hello"
3. Wait for AI response
4. Send second message: "What is your name?"
5. Wait for AI response

**Expected Results**:

- Session created on first message
- Same session ID used for second message
- AI maintains conversation context (remembers first message)
- No 404 "session not found" errors

**Verification Checklist**:
- [ ] Session created on first message
- [ ] Session ID persists for subsequent messages
- [ ] Conversation context maintained
- [ ] No session recreation on each message

---

## Debugging

### Console Logs

Enable console logs in Obsidian:

1. Open **Developer Tools** (Ctrl+Shift+I / Cmd+Option+I)
2. Go to **Console** tab
3. Look for Note Buddy logs:
   - Settings loaded/saved
   - Connection attempts
   - Session creation
   - Message sends
   - Errors with stack traces

### Common Issues

**Issue**: "Failed to connect: connection refused"
- **Cause**: opencode service not running
- **Fix**: Start opencode service on configured port (default 4096)

**Issue**: "Failed to connect: timeout"
- **Cause**: Service hung or network issue
- **Fix**: Restart service, check firewall settings

**Issue**: "Failed to send message: session not found" (404)
- **Cause**: Session became invalid or service restarted
- **Fix**: Plugin should recreate session automatically

**Issue**: "Failed to send message: service unavailable"
- **Cause**: Service went down between connection and send
- **Fix**: Test connection again, restart service

**Issue**: Send button disabled, can't send
- **Cause**: Previous message still sending (in-flight guard) or timeout
- **Fix**: Wait for previous send to complete or timeout

**Issue**: AI doesn't remember previous messages
- **Cause**: Session not persisted or recreated on each message
- **Fix**: Verify session ID is stored and reused

---

## API Testing

### Manual API Testing

Use `curl` to test opencode serve directly:

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

---

## Summary

**Total Test Scenarios**: 6

**User Stories Coverage**:
- US1 (Open Chat View): Scenario 5
- US2 (Test Connection): Scenario 1
- US3 (Send Message): Scenarios 2, 3, 4, 6

**Passing Criteria**:
- [ ] All verification checklists pass
- [ ] No console errors
- [ ] All expected behaviors observed
- [ ] Session persists across message sends

**Ready for Production**:
- [ ] All scenarios pass
- [ ] Edge cases tested
- [ ] Error handling verified
- [ ] Session management verified
