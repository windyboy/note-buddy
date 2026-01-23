# OpenCode API Contract

**Version**: 1.0
**Base URL**: Configurable (default: `http://localhost:8000`)
**Protocol**: HTTP/HTTPS (user-configured)
**Authentication**: Bearer token (API key)

## Overview

OpenCode uses a session-based conversation API. The Note Assistant plugin will:
1. Create a session for each operation
2. Send a message with the note content and operation request
3. Parse the AI response to extract suggestions
4. Delete the session after operation completes

---

## Core Endpoints

### GET /global/health

Check if OpenCode server is available.

**Request**: None

**Response** (200 OK):
```json
{
  "healthy": true,
  "version": "1.0.0"
}
```

**Response** (503 Service Unavailable):
```json
{
  "code": "service_unavailable",
  "message": "Server is unhealthy"
}
```

---

### POST /session

Create a new OpenCode session.

**Headers**:
```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request**:
```json
{
  "title": "Note Assistant: Summarize",
  "permission": {
    "read": { "*": "deny" },
    "edit": { "*": "deny" },
    "bash": { "*": "deny" }
  }
}
```

**Response** (201 Created):
```json
{
  "id": "ses_abc123",
  "directory": "/path/to/vault",
  "time": {
    "created": 1706000000000,
    "updated": 1706000000000
  }
}
```

---

### POST /session/{sessionID}/message

Send a message to the session and receive AI response.

**Headers**:
```
Authorization: Bearer <api-key>
Content-Type: application/json
```

**Request**:
```json
{
  "parts": [
    {
      "type": "text",
      "text": "Please summarize the following note:\n\n[note content here]"
    }
  ]
}
```

**Response** (200 OK):
```json
{
  "info": {
    "id": "msg_xyz789",
    "sessionID": "ses_abc123",
    "role": "user",
    "time": {
      "created": 1706000000000
    }
  },
  "parts": [
    {
      "id": "part_123",
      "sessionID": "ses_abc123",
      "messageID": "msg_xyz789",
      "type": "text",
      "text": "Here is a summary:\n- Point 1\n- Point 2\n- Point 3"
    }
  ]
}
```

---

### DELETE /session/{sessionID}

Delete a session and clean up resources.

**Headers**:
```
Authorization: Bearer <api-key>
```

**Response** (200 OK):
```json
true
```

---

## Operation-Specific Prompts

The plugin will use natural language prompts to request specific operations from OpenCode.

### Summarize Operation

**Prompt Template**:
```
Please provide a concise summary of the following note in 3-5 bullet points. Focus on the main ideas and key takeaways.

Note content:
[note content here]

Return only the bullet points, no additional explanation.
```

**Expected Response Format**:
```
- Main point 1
- Main point 2
- Main point 3
```

---

### Extract Tasks Operation

**Prompt Template**:
```
Please analyze the following note and extract all action items, tasks, or to-dos mentioned in natural language.

Note content:
[note content here]

Return each task as a markdown checkbox item (- [ ] task description). Only return the task list, no additional explanation.
```

**Expected Response Format**:
```
- [ ] Call John about project
- [ ] Review documentation
- [ ] Schedule meeting
```

---

### Improve Structure Operation

**Prompt Template**:
```
Please analyze the structure of the following note and suggest specific improvements such as:
- Adding headings to organize sections
- Splitting long paragraphs
- Improving logical flow

Note content:
[note content here]

For each suggestion, provide:
1. The type of change (heading, paragraph_split, etc.)
2. The exact content to insert
3. The line number where it should be inserted
4. A brief explanation

Format as JSON array.
```

**Expected Response Format**:
```json
[
  {
    "type": "heading",
    "content": "## Introduction",
    "line": 5,
    "explanation": "Add heading to structure opening paragraphs"
  },
  {
    "type": "paragraph_split",
    "content": "\n\n",
    "line": 12,
    "explanation": "Split long paragraph for readability"
  }
]
```

---

### Suggest Links Operation

**Prompt Template**:
```
Please analyze the following note and suggest relevant links to other notes in the vault.

Note content:
[note content here]

Available notes in vault:
[list of note titles/paths]

For each suggestion, provide:
1. The note to link to
2. The line number where the link should be inserted
3. A brief explanation of why it's relevant

Format as JSON array.
```

**Expected Response Format**:
```json
[
  {
    "note": "Project Planning",
    "line": 8,
    "explanation": "Related to project timeline discussion"
  },
  {
    "note": "Architecture Design",
    "line": 15,
    "explanation": "References system architecture"
  }
]
```

---

## Error Handling

### Connection Errors

**Scenario**: OpenCode service unavailable (connection refused)

**Plugin Behavior**:
- Display error: "Cannot connect to OpenCode service. Please check that the service is running."
- Provide "Retry" button
- Mark operation as FAILED

---

### Authentication Errors

**Scenario**: Invalid or missing API key (401 Unauthorized)

**Plugin Behavior**:
- Display error: "Authentication failed. Please check your API key in settings."
- Provide "Open Settings" button
- Mark operation as FAILED

---

### Timeout Errors

**Scenario**: Request exceeds timeout (default: 30s)

**Plugin Behavior**:
- Display error: "Request timed out. The note may be too large."
- Suggest chunking for large notes
- Provide "Retry" button

---

### HTTP Errors

**4xx Client Errors**:
- 400 Bad Request: "Invalid request. Please try again."
- 404 Not Found: "Endpoint not found. Please check OpenCode configuration."

**5xx Server Errors**:
- 500 Internal Server Error: "OpenCode service error. Please try again later."
- 503 Service Unavailable: "OpenCode service temporarily unavailable."

---

## Implementation Notes

### Session Lifecycle

1. **Create Session**: Call `POST /session` with restrictive permissions
2. **Send Message**: Call `POST /session/{sessionID}/message` with operation prompt
3. **Parse Response**: Extract suggestions from response parts
4. **Clean Up**: Call `DELETE /session/{sessionID}` to remove session

### Response Parsing

- Extract text from `parts` array where `type === "text"`
- Parse structured responses (JSON) for improve_structure and suggest_links
- Handle plain text responses for summarize and extract_tasks

---

**Contract Complete** - Based on OpenCode API v1.0 specification.
