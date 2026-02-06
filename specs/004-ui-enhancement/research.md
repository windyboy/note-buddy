# Research: UI Enhancement

**Date**: 2026-02-02
**Feature**: 004-ui-enhancement

## Research Topics

### 1. Obsidian CSS Variables & Design Patterns

**Decision**: 使用 Obsidian 内置 CSS 变量实现主题兼容

**Rationale**:
- Obsidian 提供完整的 CSS 变量系统
- 自动适配 light/dark 主题
- 保持与原生界面一致性

**Key Variables**:
- `--background-primary`: 主背景色
- `--background-secondary`: 次要背景色
- `--text-normal`: 正常文本色
- `--text-muted`: 弱化文本色
- `--interactive-accent`: 强调色/按钮色
- `--background-modifier-border`: 边框色

### 2. Message Bubble Styling

**Decision**: 用户消息右对齐深色背景，AI消息左对齐浅色背景

**Rationale**:
- 符合主流聊天应用的视觉习惯
- 清晰区分消息来源
- 使用 CSS 变量保持主题兼容

**Alternatives Considered**:
- 仅用颜色区分（不够直观）
- 添加头像（过于复杂）

### 2.1 Modern Chat Layout

**Decision**: 采用浮层输入区 + 卡片式消息舞台 + 轻量阴影的现代布局。

**Rationale**:
- 现代聊天产品常见布局，易于用户理解
- 浮层输入区让消息区更聚焦
- 轻量阴影提升层次但不破坏主题一致性

**Alternatives Considered**:
- 传统固定底栏（层次感不足）
- 全边框布局（视觉偏重）

### 2.2 Empty State Guidance

**Decision**: 使用轻量空白态（标题 + 一句说明），不遮挡输入区。

**Rationale**:
- 首次打开时提供引导，减少空白感
- 不干扰输入区交互

**Alternatives Considered**:
- 大面积插画（干扰注意力）
- 只显示系统提示（不够显性）

### 2.3 Icon-First Toolbar Controls

**Decision**: 采用图标按钮为主，提供悬浮提示；仅在必要时使用文字。

**Rationale**:
- 视觉更轻量，符合现代聊天工具栏
- 可在窄宽度下保持布局稳定
- 悬浮提示保证可理解性

**Alternatives Considered**:
- 纯文字按钮（显得厚重）
- 图标+文字并列（占用空间）

### 3. Loading Indicator Pattern

**Decision**: 使用 CSS 动画的三点跳动指示器

**Rationale**:
- 轻量级，无需额外依赖
- 视觉效果专业
- 易于实现和维护

**Alternatives Considered**:
- Spinner 旋转图标（过于通用）
- 进度条（无法预估进度）

### 4. Error Handling UI

**Decision**: 内联错误提示 + 重试按钮

**Rationale**:
- 错误信息紧邻失败消息
- 用户可立即重试
- 不打断对话流程

### 5. Settings Panel Organization

**Decision**: 两个分组：连接设置、模型选择

**Rationale**:
- 设置项数量少，两组足够
- 逻辑清晰，易于理解
- 符合 Obsidian 设置面板风格

### 6. Markdown Rendering

**Decision**: 使用简单的 DOM 操作手动渲染基础 markdown 元素

**Rationale**:
- 仅需支持有限的 markdown 元素（代码块、行内代码、粗体、斜体、列表）
- 避免引入额外依赖（marked.js 或 markdown-it 过重）
- 使用正则表达式 + DOM 创建即可满足需求
- 保持插件体积小巧

**Alternatives Considered**:
- marked.js（功能过多，体积较大）
- markdown-it（配置复杂）
- Obsidian 内置渲染器（API 不够灵活）

**Implementation Approach**:
- 代码块：`<pre><code>` 标签
- 行内代码：`<code>` 标签
- 粗体：`<strong>` 标签
- 斜体：`<em>` 标签
- 列表：`<ul>/<ol>` + `<li>` 标签

## Conclusions

所有技术决策已明确，无需进一步澄清。可进入 Phase 1 设计阶段。
