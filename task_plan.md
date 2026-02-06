# Task Plan: Refactor chat-view.ts to use pluginData-based session architecture

## Current State
- chat-view.ts uses old architecture: `this.messages` array, `this.plugin.sessionState`
- Uses OpenCodeClient with `createSession()` and `sendMessageToSession()` (non-streaming)
- No session list UI, no session management UI

## Target State (per 005-chat-page spec)
- Use `plugin.pluginData.sessions` for session storage
- Load active session from `pluginData.activeSessionId`
- Render messages from `activeSession.messages`
- Add session list sidebar (Obsidian file explorer style)
- Session switching, creation, deletion
- Streaming message responses
- Token usage tracking
- Model selection per session

## Implementation Steps

### Step 1: Update Class Properties
- Remove `this.messages: UiChatItem[] = []`
- Add `activeSession: ChatSession | undefined`
- Add `isStreaming: boolean = false`
- Add `currentAbortController: AbortController | null = null`
- Add `currentReply: string = ''`
- Update `this.client` initialization to use `pluginData.settings`

### Step 2: Add Session State Management
- Add `loadChatState()`: loads active session from pluginData
- Add `getCurrentSession()`: returns active session from plugin
- Add `switchSession()`: switches active session

### Step 3: Add Session List UI
- Add `renderSessionList()`: renders sidebar session list
- Add `onNewSession()`: creates new session
- Add `onDeleteSession()`: deletes session
- Style like Obsidian file explorer

### Step 4: Update Message Rendering
- Update `renderMessages()`: render from `activeSession.messages`
- Add loading state indicator
- Add token usage display

### Step 5: Implement Streaming sendMessage
- Replace non-streaming API with streaming
- Use AbortController for cancellation
- Update `activeSession.messages` in real-time
- Track token usage

### Step 6: Add Model Selection
- Add model dropdown per session
- Update session model on change

## Files to Modify
- src/chat-view.ts (complete refactor)

## Dependencies
- src/main.ts (already has pluginData methods)
- src/models.ts (already has ChatSession, ChatMessage types)

