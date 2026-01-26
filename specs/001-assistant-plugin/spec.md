---
# Note Buddy – Initial UI

**Branch**: `001-init-structure`  
**Date**: 2026-01-26  
**Goal**: Create a minimal Obsidian plugin with a sidebar chat view and a ribbon toggle.

---

## Overview

This feature sets up the basic structure of the Note Buddy plugin:
- Plugin scaffold
- A single sidebar chat view
- Ribbon icon to open or focus the view

No AI logic, persistence, or settings yet.

---

## User Stories

### 1. Open Chat View from Ribbon (P1)

As a user, I want a quick way to open the Note Buddy chat panel.

**Expected behavior**:
- Clicking the ribbon icon opens the chat view in the right sidebar.
- Clicking it again focuses the existing view.
- Closing the view and clicking the icon reopens it.
- Only one chat view should ever exist.
- View state persists across Obsidian restarts (reopens if previously open).

---

### 2. Basic Chat UI Layout (P1)

As a user, I want to see a familiar chat layout, even if it does nothing yet.

**Layout**:
- Header with title: **Note Buddy**
- Scrollable message area with messages anchored at bottom, new messages appear below existing ones
- Bottom input bar with:
  - Textarea
  - Send button icon

**Temporary behavior**:
- Clicking "Send" logs the message to the console.
- The input field is cleared afterward.
- Displays a brief "Message sent" toast notification for user feedback.
- Keyboard shortcut: Enter to send, Shift+Enter for new line.

---

## Edge Notes

- If the right sidebar is collapsed, opening the chat should expand it.
- Use Obsidian’s built-in CSS variables so the UI works in light/dark mode.
- On mobile, rely on Obsidian’s default view handling.

---

## Requirements

### Functional
- Plugin ID: `note-buddy`
- View type: `note-buddy-chat`
- Register a single `ItemView`
- Ribbon icon uses Lucide `"bot"`
- Build UI using Obsidian’s DOM helpers (no raw HTML strings)
- Prevent duplicate views

### UI
- Use flex layout so the message area grows and scrolls.
- Use standard Obsidian button and input styles.

---

## Done When

- Plugin enables without errors.
- Ribbon icon reliably opens or focuses the chat view.
- Chat UI renders correctly in light and dark themes.
- No duplicate views can be created.

---

## Not Included

- LLM integration
- Saving chat history
- Markdown rendering
- Settings UI

---

## Clarifications

### Session 2026-01-26

- Q: 当用户点击发送按钮后，应该显示什么反馈？ → A: 在输入框上方显示短暂的"消息已发送"提示 toast 通知
- Q: 输入区域应该包含哪些UI元素？ → A: 输入框 + 发送按钮图标
- Q: View 状态是否应该在应该 Obsidian 重启后持久化？ → A: 是，持久化并恢复打开状态
- Q: 输入框的键盘快捷键是什么？ → A: Enter 发送，Shift+Enter 换行
- Q: 消息显示区域的消息如何排列？ → A: 消息气泡在底部，新消息在下
