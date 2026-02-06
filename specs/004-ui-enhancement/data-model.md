# Data Model: UI Enhancement

**Date**: 2026-02-02
**Feature**: 004-ui-enhancement

## Entities

### Message

聊天消息实体，扩展现有 `UiChatItem` 类型。

| Field | Type | Description |
|-------|------|-------------|
| id | string | 唯一标识符 |
| kind | 'user' \| 'assistant' \| 'system' | 消息类型 |
| content | string | 消息内容 |
| timestamp | Date | 发送时间 |
| status | 'sending' \| 'sent' \| 'error' | 发送状态 |
| error? | string | 错误信息（仅status=error时） |

### UIState

界面状态管理。

| Field | Type | Description |
|-------|------|-------------|
| isLoading | boolean | AI是否正在处理 |
| isConnected | boolean | 服务连接状态 |
| error | string \| null | 全局错误信息 |

## State Transitions

### Message Status

```
sending → sent (成功)
sending → error (失败)
error → sending (重试)
```

## Relationships

- ChatView 持有 Message[]
- ChatView 持有 UIState
- Settings 独立于 ChatView
