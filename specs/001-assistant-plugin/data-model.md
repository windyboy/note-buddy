---
# Data Model: Note Buddy – Initial UI (Refined)

**Feature**: Note Buddy – Initial UI  
**Date**: 2026-01-26  
**Scope**: Ephemeral UI state only. No persistence.

---

## Overview

This feature does not define any persistent entities. The “data model” is limited to in-memory UI state owned by a single `ChatView` instance while it is open.

---

## In-Memory State

### ChatViewState

Minimal state required to support the initial UI behavior.

```ts
type ThemeMode = "light" | "dark" | "unknown";

interface ChatViewState {
  // Text currently in the input textarea.
  inputText: string;

  // Whether a "send" action is in progress (future-proof for async send).
  // For this feature it will always be false except briefly during click handling.
  isSending: boolean;

  // Derived display mode (optional convenience). Do not treat as source of truth.
  // It may be recalculated on render/theme change.
  themeMode: ThemeMode;
}
