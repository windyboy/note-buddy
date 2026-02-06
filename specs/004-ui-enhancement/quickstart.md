# Quickstart: UI Enhancement

**Feature**: 004-ui-enhancement

## Prerequisites

- Bun 已安装
- Obsidian 开发环境已配置
- OpenCode 服务运行中

## Quick Start

```bash
# 安装依赖
bun install

# 开发模式
bun run dev

# 运行测试
bun test
```

## 验证步骤

### 1. Chat Interface

1. 打开 NoteBuddy 聊天视图
2. 发送一条消息
3. 验证：
   - 用户消息显示在右侧
   - 加载指示器出现
   - AI回复显示在左侧
   - 阅读历史时新消息出现会显示“新消息”提示
   - 空白态显示欢迎标题和说明

### 2. Settings Panel

1. 打开 Obsidian 设置 → NoteBuddy
2. 验证：
   - 设置按分组显示
   - URL 验证正常工作
   - 测试连接按钮有反馈

### 3. Error Handling

1. 断开网络连接
2. 发送消息
3. 验证：
   - 显示错误提示
   - 重试按钮可用

### 4. Toolbar Actions

1. 点击工具栏清空按钮
2. 确认清空
3. 验证：
   - 消息清空并显示空白态引导
   - 可以继续发送新消息

## 文件变更

| 文件 | 变更类型 |
|------|----------|
| src/chat-view.ts | 修改 |
| src/settings.ts | 修改 |
| src/styles.css | 新增 |
| src/models.ts | 修改 |
