# Feature Specification: Opencode Client Interface

**Feature Branch**: `001-opencode-client`  
**Created**: 2025-01-21  
**Status**: Draft  
**Input**: User description: "创建一个与opencode对话的界面，作为opencode的客户端，可以询问obsidian笔记的内容，组织笔记"

## User Scenarios & Testing *(mandatory)*

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

- Empty vault or no markdown files
- Malformed/corrupted note files
- Ambiguous queries with multiple valid interpretations
- Very large notes that exceed typical processing limits
- Vault path does not exist or is inaccessible
- Notes with special characters or non-standard markdown
- AI service unavailable or times out

## Requirements *(mandatory)*

### Functional Requirements

- Connect to Opencode server with configurable endpoint
- Send prompts and display responses in UI
- Read and parse markdown files from Obsidian vault
- Provide conversational interface for natural language queries
- Retrieve and reference relevant note content in responses
- Maintain conversation context within sessions
- Support creating, viewing, continuing, and deleting sessions
- Handle errors gracefully with user-friendly messages
- Provide organization suggestions (links, tags, structure) that reference notes

### Key Entities

- **Conversation Session**: A distinct chat thread with its own history, metadata (title, created date, last activity), and context scope
- **Message**: A single user or system entry with content, sender, timestamp, and optional note references
- **Obsidian Note**: A markdown file from the vault with path, title, content, and metadata
- **Organization Suggestion**: A recommendation (link, tag, structural change) that references the relevant notes

## Success Criteria *(mandatory)*

- Query responses complete within 5 seconds
- Session creation completes within 3 seconds
- Vaults up to 1,000 notes process without performance issues
- Most queries return relevant, note-grounded responses
- Follow-up context is resolved correctly in most cases

## Non-Functional Requirements *(optional)*

### Performance

- Query responses should complete within 5 seconds for typical vault sizes
- Initial vault indexing should complete within 30 seconds for vaults up to 1,000 notes
- Session switching should complete within 1 second

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
