# Feature Specification: Opencode Client Interface

**Feature Branch**: `001-opencode-client`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "创建一个与opencode对话的界面，作为opencode的客户端，可以询问obsidian笔记的内容，组织笔记"

## User Scenarios & Testing _(mandatory)_

### User Story 0 - Opencode Client Connectivity (Priority: P1)

A user needs a working Opencode client that can send prompts and receive responses from the Opencode server reliably.

**Why this priority**: Without basic client connectivity, no higher-level note features can function.

**Independent Test**: Send a prompt to the Opencode server and verify a response is returned and displayed in the UI.

**Acceptance Scenarios**:

1. **Given** the Opencode server is reachable, **When** the user sends a prompt, **Then** the system returns and displays the server response
2. **Given** the Opencode server is unreachable or returns an error, **When** the user sends a prompt, **Then** the system shows a clear, actionable error message
3. **Given** the user sends multiple prompts in sequence, **When** responses arrive (even out of order), **Then** each response is matched to the correct prompt

---

### User Story 1 - Query Obsidian Notes (Priority: P1)

A user asks questions about their Obsidian notes and expects answers grounded in the actual note content. The system must interpret natural language queries and retrieve relevant content from the vault.

**Why this priority**: This is the core value proposition - enabling users to interact with their notes through natural language conversation, making it easier to find and understand information stored in their Obsidian vault.

**Independent Test**: Send natural language queries and verify responses quote or cite matching note content.

**Acceptance Scenarios**:

1. **Given** the vault has notes, **When** the user asks a question, **Then** the answer is grounded in specific note content (e.g., quoted snippets or referenced note titles)
2. **Given** there is no relevant content, **When** the user asks a question, **Then** the system states that no relevant information was found
3. **Given** the user asks a multi-part question, **When** the system processes it, **Then** the response addresses each part with content from multiple notes when applicable

---

### User Story 2 - Conversation Context (Priority: P1)

A user wants an ongoing conversation where the system retains prior turns within the current session, enabling follow-up questions without restating context.

**Why this priority**: Conversational context is essential for a natural chat experience. Without it, users must repeat context in each query, making the interaction tedious and less useful.

**Independent Test**: Run a multi-turn conversation and verify the system resolves references to prior turns without the user restating context.

**Acceptance Scenarios**:

1. **Given** the user asks about a topic, **When** they ask a follow-up question, **Then** the system uses the prior turn(s) to resolve references
2. **Given** the user discusses multiple topics, **When** they refer back to an earlier topic, **Then** the system correctly interprets the reference
3. **Given** a new session starts, **When** the user asks a question, **Then** no prior session context is used

---

### User Story 3 - Organize Notes (Priority: P2)

A user wants to receive suggestions for organizing and improving their Obsidian notes, such as identifying related notes, suggesting tags, or recommending structural improvements.

**Why this priority**: While querying provides immediate value, organization suggestions help users maintain better note structure over time, improving the long-term utility of their knowledge base.

**Independent Test**: Request organization suggestions and verify that recommendations cite or reference specific notes and are actionable.

**Acceptance Scenarios**:

1. **Given** the user requests organization suggestions, **When** the system analyzes notes, **Then** it returns actionable recommendations and references the notes involved
2. **Given** related notes without links, **When** the user asks for connections, **Then** the system suggests links between specific notes
3. **Given** the user requests tags, **When** the system analyzes note content, **Then** it recommends tags based on observed topics/themes

---

### User Story 4 - Manage Conversation Sessions (Priority: P2)

A user wants to start, view, continue, and delete conversation sessions, allowing them to reference past conversations and maintain organized chat history.

**Why this priority**: Session management enables users to return to previous conversations, maintain separate conversations for different topics, and keep their chat history organized.

**Independent Test**: Create multiple sessions, switch between them, and verify each session preserves its own history and context.

**Acceptance Scenarios**:

1. **Given** multiple sessions exist, **When** the user views the list, **Then** all sessions appear with metadata (title, created date, last activity)
2. **Given** a prior session is selected, **When** the user sends a message, **Then** the response uses that session's history
3. **Given** a session is deleted, **When** the user checks the list, **Then** it is removed and its history is no longer accessible

---

### Edge Cases

- **EC-001**: Empty vault or no markdown files - System MUST inform user and handle gracefully without crashing.
- **EC-002**: Malformed/corrupted note files - System MUST skip invalid files and log errors to the Obsidian console.
- **EC-003**: Ambiguous queries - System MUST present a "Clarification Required" UI pattern with up to 3 suggested interpretations as clickable buttons.
- **EC-004**: Very large notes (>1MB) - System MUST process content in 4KB chunks. If a note cannot be chunked (e.g., single massive line), the system MUST notify the user that the note is too large for context.
- **EC-005**: Vault path does not exist - System MUST prompt user to select a valid path via Obsidian settings.
- **EC-006**: Sanitization - All user inputs MUST be sanitized using DOMPurify-equivalent logic to prevent XSS from note content rendering.
- **EC-007**: Connectivity Failure - System MUST retry 3 times with exponential back-off (1s, 2s, 4s) with +/- 100ms jitter. Total retry time MUST NOT exceed 10 seconds.
- **EC-008**: Partial Failure - If the Opencode server is reachable but the AI engine fails, the system MUST distinguish between "Network Error" and "Intelligence Service Error" in the UI.
- **EC-009**: Plugin Reload - System MUST persist the current session ID to `data.json` to allow recovery of the conversation after an Obsidian reload.

## Requirements

### Functional Requirements

- **FR-001**: System MUST connect to Opencode server with configurable endpoint.
- **FR-002**: System MUST send prompts and display responses. Chat UI MUST support `Tab` navigation for all buttons and `Enter` for sending prompts.
- **FR-003**: System MUST provide loading indicators: a progress bar for initial vault indexing and a pulsing "typing" indicator for query processing.
- **FR-004**: System MUST provide conversational interface for natural language queries.
- **FR-005**: System MUST retrieve note content. References MUST include Note Title, Path, and a Contextual Snippet.
- **FR-006**: System MUST maintain conversation context within sessions.
- **FR-007**: System MUST support creating, viewing, continuing, and deleting sessions.
- **FR-008**: System MUST handle errors with "Helpful Errors" (Actionable steps included in the message).
- **FR-009**: System MUST provide organization suggestions (links, tags, structure) that reference notes.
- **FR-010**: System MUST support auto-archiving of sessions based on user-defined age (default: 30 days).
- **FR-011**: System MUST support streaming vault indexing to allow the user to start querying while background indexing is in progress.
- **FR-012**: System MUST include a "Debug Mode" toggle in settings to enable detailed console logging.

### Key Entities

- **Conversation Session**: A distinct chat thread with its own history, metadata (title, created date, last activity), and context scope
- **Message**: A single user or system entry with content, sender, timestamp, and optional note references
- **Obsidian Note**: A markdown file from the vault with path, title, content, and metadata
- **Organization Suggestion**: A recommendation (link, tag, structural change) that references the relevant notes

## Success Criteria

- **SC-001**: Typical query responses (excluding retries) complete within 5 seconds.
- **SC-002**: Session creation/switching completes within 1 second.
- **SC-003**: Performance Scalability: Indexing operation MUST NOT block the UI thread and MUST complete within 30 seconds for 1,000 notes; Querying MUST maintain < 500ms latency for local retrieval of up to 1,000 notes.
- **SC-004**: Groundedness: At least 85% of queries MUST cite at least one valid Note Title from the current vault. "Relevance" is defined as the citation containing keywords found in both the query and the referenced note.
- **SC-005**: Context: Follow-up queries (e.g., "Tell me more about it") MUST resolve pronouns/references correctly in 90% of test cases using a predefined "Golden Dataset" fixture located in `tests/fixtures/golden-conversations.json`.
- **SC-006**: Organization Performance: Link and tag suggestions (US3) MUST be generated within 3 seconds for vaults up to 1,000 notes. Tag suggestions MUST prioritize existing vault tags (90% match rate) before suggesting new ones.

## Non-Functional Requirements _(optional)_

### Performance

- All performance targets defined in [Success Criteria](#success-criteria) MUST be met.
- Memory usage should stay below 100MB for typical vault operations.

### Usability

- Users should be able to ask their first question without reading documentation
- Error messages should be clear and actionable
- Conversation history should be easy to navigate

### Reliability

- The system should handle unexpected note formats without crashing
- AI service interruptions should degrade gracefully (retry or fail with a clear message)
- User data should not be lost if the system terminates unexpectedly

## Assumptions

- User has an existing Obsidian vault with markdown files
- User has basic understanding of their note content and topics
- AI service providing intelligence has sufficient capability to understand natural language queries
- User's Obsidian vault is stored locally and accessible to the application
- Notes primarily contain text content in markdown format
- User can reach the Opencode server endpoint (and has credentials if required)

## Dependencies

- Access to the Opencode server for prompt/response
- Access to an AI service for natural language processing and query understanding (if distinct from Opencode)
- Ability to read files from the user's local filesystem
- User has permission to access their Obsidian vault directory

## Out of Scope

- Editing or modifying Obsidian notes directly through the interface
- Real-time synchronization with Obsidian while notes are being edited
- Multi-user support or sharing conversations between users
- Integration with external note-taking systems beyond Obsidian
- Advanced markdown rendering or preview features
