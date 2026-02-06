# NoteBuddy 问题修复计划（基于 PLUGIN_AUDIT_REPORT.md）

**计划日期**: 2026-02-06  
**来源报告**: `PLUGIN_AUDIT_REPORT.md`  
**目标**: 按优先级完成已确认问题修复，降低性能风险、状态一致性风险和维护成本。

---

## 1. 范围与原则

### 1.1 修复范围

- P0（必须先完成）
  - 全量重绘性能问题
  - Abort 后残留空 assistant 消息
- P1（紧随其后）
  - `any` 类型收敛
  - 会话消息上限
  - 模型选项构建逻辑去重
  - “流式”语义与实现一致化
  - `ChatView` 复杂度下降
- P2（可并行安排）
  - `forceRefresh` 参数语义修正
  - 请求去重与重试
  - 测试命名一致性

### 1.2 执行原则

- 每个问题单独提交，避免大改混杂。
- 每个问题必须附带测试或回归验证步骤。
- 先修行为正确性，再做结构优化。
- 保持 Obsidian 插件 API 兼容，避免破坏已有用户数据。

---

## 2. 里程碑与交付节奏

### M1（第 1-2 天）: P0 完成并可回归

- 完成 Abort 残留消息修复。
- 完成消息渲染增量更新（至少做到发送过程中不全量重绘）。
- 新增对应测试。
- `bun test` + 手动场景验证通过。

### M2（第 3-5 天）: P1 核心质量改进

- 去除关键 `any`。
- 引入消息上限与裁剪。
- 抽取模型选项构建共享函数。
- 明确并统一“流式”策略（代码和命名一致）。
- `ChatView` 主流程拆分到私有 helper（不强制大规模架构迁移）。

### M3（第 6-7 天）: P2 与工程化收尾

- 修正 `forceRefresh` 参数语义。
- 实现请求去重，评估并实现有限重试策略。
- 统一测试命名并确保 CI-ready（如新增 CI 可选）。

---

## 3. 详细任务清单

## 3.1 P0-1 修复 Abort 后空 assistant 消息

### 问题映射
- 报告问题: P0-2
- 证据文件: `src/chat-view.ts`

### 目标结果
- 用户触发中断（切会话/关闭视图）后，不会保存空 assistant 消息。

### 实施步骤
1. 在 `sendMessage()` 中标记当前 assistant 消息状态（创建后未完成）。
2. 在 `catch` 或 `finally` 中处理 `AbortError`：
   - 若 `assistantMessage.content` 为空，则移除该消息。
   - 若已有内容，可按产品策略保留“已中断”内容或添加状态标记。
3. 确保 `savePluginData()` 时机不把空消息写盘。

### 涉及文件
- `src/chat-view.ts`
- `tests/unit/ChatView.test.ts`（新增中断场景测试）

### 验收标准
- 发送中切换会话后，消息列表无空 assistant 气泡。
- 重启插件后也不会出现该空消息（证明未持久化）。

### 回归测试
- `bun test`
- 手动：发送 -> 立即切换会话 -> 返回原会话检查。

---

## 3.2 P0-2 渲染改为增量更新，避免全量重建

### 问题映射
- 报告问题: P0-1
- 证据文件: `src/chat-view.ts:509-552`

### 目标结果
- 发送与流式更新阶段，不再每次 `renderMessages()` 全量重建。

### 实施步骤
1. 保留 `renderMessages()` 用于“会话切换/初始化”。
2. 新增：
   - `appendMessage(message: ChatMessage)`
   - `updateMessageContent(messageId: string, content: string)`
3. `sendMessage()` 中：
   - 用户消息直接 append。
   - assistant 消息创建后 append 一次。
   - 更新内容时只更新对应 DOM 节点。
4. 为消息 DOM 建立 `message.id -> element` 映射，切会话时重置。

### 涉及文件
- `src/chat-view.ts`
- `tests/unit/ChatView.test.ts`（补增量渲染行为测试）

### 验收标准
- 发送过程中不调用全量重绘路径。
- 100+ 条历史消息下发送新消息无明显卡顿（手动验证）。

### 回归测试
- `bun test`
- 手动：构造长会话后连续发送 5 条消息观察 UI 流畅度。

---

## 3.3 P1-1 收敛 `any` 类型

### 问题映射
- 报告问题: P1-4

### 目标结果
- `ChatView` 的 `plugin` 参数改为明确类型。
- `service.ts` 的 `request` 返回值收窄到可维护类型（或用 `unknown` + 解析）。

### 实施步骤
1. `src/chat-view.ts`：`import NoteBuddyPlugin from './main'`，替换 `private plugin: any`。
2. `src/service.ts`：为 `requestUrl` 响应建立最小结构类型，减少 `Promise<any>` 扩散。
3. 清理受影响的断言与类型注释。

### 涉及文件
- `src/chat-view.ts`
- `src/service.ts`
- `tests/unit/ChatView.test.ts`, `tests/unit/service.test.ts`（必要时调整 mock 类型）

### 验收标准
- 生产代码中不再出现不必要 `any`（允许测试 mock 局部使用）。
- `bun run build` 通过。

---

## 3.4 P1-2 会话消息上限与裁剪策略

### 问题映射
- 报告问题: P1-6

### 目标结果
- 每个会话消息数量受控，避免无限膨胀。

### 实施步骤
1. 在 `src/models.ts` 或配置中定义常量（如 `MAX_MESSAGES_PER_SESSION = 1000`）。
2. 每次追加消息后执行裁剪：保留最近 N 条。
3. 裁剪后同步会话 usage 的一致性策略（保留累计值或重算，需明确）。

### 涉及文件
- `src/models.ts`
- `src/chat-view.ts`
- `src/main.ts`（如 addMessage 统一入口也做防护）
- `tests/unit/main.test.ts` 或新增 `tests/unit/session-limit.test.ts`

### 验收标准
- 超过上限时自动裁剪，功能正常。
- 数据持久化后会话大小受控。

---

## 3.5 P1-3 模型选项构建逻辑去重

### 问题映射
- 报告问题: P1-5

### 目标结果
- `settings.ts` 与 `chat-view.ts` 共享同一模型选项构建函数。

### 实施步骤
1. 新增 `src/utils/model-options.ts`（或同等命名）。
2. 导出 `buildModelOptions(providers)`。
3. 两处调用统一改造并保持默认项一致。

### 涉及文件
- `src/settings.ts`
- `src/chat-view.ts`
- `src/utils/model-options.ts`
- 对应单测文件

### 验收标准
- 逻辑单一来源，行为一致。
- 测试覆盖“空 provider / 多 provider / 重名模型”场景。

---

## 3.6 P1-4 “流式”语义与实现一致化

### 问题映射
- 报告问题: P1-7

### 目标结果（二选一）

- 方案 A（低风险）: 明确为非流式，重命名 API 与 UI 状态文案。  
- 方案 B（中风险）: 实现真正 chunk 级流式（前提是后端接口支持）。

### 推荐
- 先采用方案 A，快速消除语义偏差；后续再评估方案 B。

### 实施步骤（方案 A）
1. `streamMessage` 更名为 `sendMessageAndGetText`（或类似）。
2. `sendMessage()` 中去除“逐块”假设，按单次响应更新。
3. 更新测试命名与断言。

### 涉及文件
- `src/service.ts`
- `src/chat-view.ts`
- `tests/unit/service.test.ts`

### 验收标准
- 命名、行为、测试语义一致。

---

## 3.7 P1-5 降低 ChatView 复杂度（轻量拆分）

### 问题映射
- 报告问题: P1-3

### 目标结果
- 不做大规模重构，先把超长方法拆成可测试 helper。

### 实施步骤
1. 拆 `onOpen()`：`buildLayout`, `bindEvents`, `initHeader`, `initInput`。
2. 拆 `sendMessage()`：`validateBeforeSend`, `appendUserMessage`, `appendAssistantPlaceholder`, `finalizeAssistantMessage`。
3. 补充私有方法单测可达性（通过公共行为验证）。

### 涉及文件
- `src/chat-view.ts`
- `tests/unit/ChatView.test.ts`

### 验收标准
- 单方法长度显著下降，可读性提升。
- 行为不回归。

---

## 3.8 P2-1 修正 `forceRefresh` 参数语义

### 问题映射
- 报告问题: P2-9

### 实施步骤
1. `settings.ts:loadProviders(client, forceRefresh)` 调用 `c.getCapabilities(!!forceRefresh)`。
2. 保留 `clearModelsCache` 逻辑作为双保险或简化移除其一。

### 验收标准
- 传 `forceRefresh=true` 时明确绕过缓存。
- 测试覆盖缓存命中/绕过两条路径。

---

## 3.9 P2-2 请求去重与重试

### 问题映射
- 报告问题: P2-10

### 实施步骤
1. `getCapabilities` 增加 `pendingCapabilitiesRequest` 去重。
2. 对幂等 GET 请求添加有限重试（如最多 2 次，指数退避）。
3. 不对发送消息默认重试（避免重复提交）。

### 验收标准
- 快速连续触发刷新时只发出一次请求。
- 瞬时网络故障下 GET 请求可自动恢复。

---

## 3.10 P2-3 测试命名统一

### 问题映射
- 报告问题: P2-11

### 实施步骤
1. 将 `tests/unit/ChatView.test.ts` 重命名为 `tests/unit/chat-view.test.ts`（如平台大小写敏感，需同步 import/脚本）。
2. 统一命名规范：`kebab-case`。

### 验收标准
- `bun test` 结果不变。
- 团队约定写入 `CONTRIBUTING.md`（可选）。

---

## 4. 测试计划（跨任务）

### 自动化

- 每个任务完成后执行：
  - `bun run build`
  - `bun test`

### 手动回归场景

1. 新建会话、切换会话、删除会话。
2. 发送消息成功、失败、超时、中断。
3. 模型切换、模型刷新、模型不可用回退。
4. 长会话（100+ 消息）发送与滚动体验。

---

## 5. 风险与回滚

### 风险

- 渲染路径调整可能引入 UI 不一致。
- 消息裁剪策略可能影响用户历史期望。
- 接口命名变更可能导致测试和调用方同步成本。

### 回滚策略

- 每个任务独立提交，可逐个回滚。
- P0 任务优先小步提交，必要时保留 feature flag（例如 `useIncrementalRender`）。

---

## 6. Definition of Done

每个问题完成必须同时满足：

1. 代码实现落地并通过 `bun run build`。  
2. 对应测试新增或更新，`bun test` 全绿。  
3. 关键手动场景通过。  
4. 文档（本计划/必要注释）更新。  
5. 提交说明包含“问题编号 + 修复范围 + 验证结果”。

---

## 7. 建议提交拆分

1. `fix(chat): remove empty assistant message on abort`
2. `perf(chat): switch message rendering to incremental updates`
3. `refactor(types): replace plugin any type and tighten service request typing`
4. `feat(chat): enforce per-session message cap`
5. `refactor(models): extract shared model options builder`
6. `refactor(service): align streaming naming with actual behavior`
7. `chore(settings): wire forceRefresh to capabilities fetch`
8. `feat(service): deduplicate capabilities requests and add retry for GET`
9. `chore(tests): normalize test file naming`

