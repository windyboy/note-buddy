# OpenCode Server API 核查 (Contract vs Plugin)

对照 `opencode-api.json` 与 NoteBuddy 插件实际调用的端点与数据格式。

## 1. 端点对照

| 用途           | 插件当前调用                     | 合约 (opencode-api.json)     | 结论 |
|----------------|----------------------------------|------------------------------|------|
| 健康检查       | `GET /global/health`             | `GET /global/health` ✓       | 一致 |
| 创建会话       | `POST /session`                  | `POST /session` ✓            | 一致 |
| 发送消息       | `POST /session/{sessionID}/message` | `POST /session/{sessionID}/message` ✓ | 一致 |
| 模型/能力发现  | `GET /config/providers`          | `GET /config/providers` ✓    | 一致 |
| 模型列表(备用) | `GET /v1/models`                 | **未定义**                   | 合约中无此路径，仅插件内部 `discoverModels()` 使用，且未被调用 |

- 合约中**没有** `/v1/models`，模型发现应以 `/config/providers` 为准。
- 插件主路径已使用 `getCapabilities()` → `/config/providers`，与合约一致。

---

## 2. 创建会话 `POST /session`

### 合约 (Session schema)

- **响应字段**: `id`, `slug`, `projectID`, `directory`, `title`, `version`, `time`（必选）；另有 `parentID`, `summary`, `share`, `permission`, `revert` 等。
- **时间**: `time.created`, `time.updated`（无 `createTime`）。
- **会话 ID**: 字段名为 `id`（pattern `^ses.*`），**不是** `sessionID`。

### 插件当前假设

```ts
sessionID: data.sessionID,
createTime: data.createTime,
title: data.title,
```

### 差异与风险

- 若服务端严格按合约返回，则返回的是 `id` 与 `time.created`，插件读取 `data.sessionID` / `data.createTime` 会得到 `undefined`，导致后续发消息用错或缺失 session ID。
- **建议**: 按合约兼容两种形态：优先 `data.id`，回退 `data.sessionID`；时间优先 `data.time?.created`，回退 `data.createTime`。

---

## 3. 发送消息 `POST /session/{sessionID}/message`

### 合约

- **描述**: "Create and send a new message to a session, **streaming the AI response**."
- **请求体**: `parts`（必选）, 可选 `model`, `agent`, `system`, `messageID`, `noReply`, `tools` 等。
- **parts**: 数组，元素为 `TextPartInput` 等；`TextPartInput` 需 `type: "text"`, `text: string`。
- **200 响应**: `application/json`，结构为 `{ info: AssistantMessage, parts: Part[] }`。

### 插件当前行为

- 请求体含 `parts` 及可选 `model`，与合约一致。
- 期望 200 时响应体为完整 JSON，并解析为 `MessageResponse`（含 `info`, `parts`）。

### 空响应原因（Server returned empty response）

- 合约明确写的是 **streaming the AI response**，实现上服务端可能：
  1. 先返回 200，再通过流式（如 SSE/chunked）推送内容，此时 HTTP 响应体可能为空或非 JSON；
  2. 流结束后再写入 JSON 体，但若客户端在流结束前就读取 body，也会得到空。
- 使用 Obsidian 的 `requestUrl` 做一次性请求时，若服务端以流式为主、不缓冲完整 JSON 到 body，就会出现“200 + 空 body”。

**建议**:

- 与 OpenCode 服务端确认：该接口是否支持**非流式**、一次性返回完整 JSON 的用法；若支持，是否需不同 path 或 query（例如 `?stream=false`）。
- 若服务端仅支持流式，插件需改为使用流式客户端（如 SSE/EventSource 或分块读取），而不是单次 `requestUrl` 读整段 body。

---

## 4. 模型/能力发现 `GET /config/providers`

### 合约

- 响应: `{ providers: Provider[], default: Record<string, string> }`，`providers` 与 `default` 必选。
- **Provider**: `id`, `name`, `source`, `env`, `options`, `models`（必选）；`models` 为 `Record<string, Model>`（对象，key 为 model id）。

### 插件当前行为

- 使用 `data.providers || []`，并遍历 `(p.models || {})` 转为 `models: { id, name }[]`，与合约的「providers + 对象形式 models」一致。
- 未使用 `default`，仅用 providers/models，可接受。

---

## 5. 健康检查 `GET /global/health`

- 合约: 200 返回 `{ healthy: true, version: string }`。
- 插件: 检查 `response.status === 200 && response.json.healthy === true`。一致。

---

## 6. 总结与建议

| 项               | 状态 | 建议 |
|------------------|------|------|
| 端点路径         | 一致 | 保持；可考虑移除或标注废弃对 `/v1/models` 的调用。 |
| 创建会话响应字段 | 不一致 | 兼容合约：`sessionID = data.id ?? data.sessionID`，`createTime = data.time?.created ?? data.createTime`。 |
| 发送消息空 body  | 合约为流式 | 确认服务端是否支持非流式 JSON；不支持则需在插件中实现流式消费。 |
| /config/providers | 一致 | 保持。 |

---

*基于 `opencode-api.json` (OpenAPI 3.1.1) 与 `src/service.ts` 核对。*
