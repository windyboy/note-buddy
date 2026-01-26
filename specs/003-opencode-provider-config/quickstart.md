# Quickstart Guide: Model Selection via OpenCode Server

**Feature**: specs/003-opencode-provider-config/spec.md
**Date**: 2026-01-26

## Overview

This guide provides implementation steps for adding model selection functionality to the NoteBuddy Obsidian plugin, allowing users to discover and select AI models from a local OpenCode server.

## Prerequisites

- NoteBuddy plugin project with Obsidian API integration
- Local OpenCode server running (from spec 002)
- TypeScript 5.x development environment
- Bun runtime for development

## Implementation Steps

### 1. Define Model Types

Create types for model descriptors in `src/models.ts`:

```typescript
export interface ModelDescriptor {
  id: string;
  object: string;
  created: number;
  owned_by: string;
}

export interface PluginSettings {
  defaultModelId?: string;
  openCodeBaseUrl?: string; // Configurable base URL
}
```

### 2. Implement Model Discovery Service

Add model discovery functionality to `src/service.ts` (requires importing `requestUrl` from 'obsidian'):

```typescript
import { requestUrl } from 'obsidian';

export class AIService {
  constructor(private baseUrl: string) {}

  async discoverModels(): Promise<ModelDescriptor[]> {
    const response = await requestUrl({
      url: `${this.baseUrl}/v1/models`,
      method: 'GET'
    });

    if (response.status !== 200) {
      throw new Error('Failed to discover models');
    }

    const data = response.json;
    return data.data; // OpenAI-compatible format
  }
}
```

### 3. Create Settings UI

Extend `src/settings.ts` to include base URL and model selection:

```typescript
export class NoteBuddySettingTab extends PluginSettingTab {
  private models: ModelDescriptor[] = [];
  private selectedModelId?: string;

  async refreshModels() {
    try {
      const baseUrl = this.plugin.settings.openCodeBaseUrl || 'http://localhost:3000';
      const service = new AIService(baseUrl);
      this.models = await service.discoverModels();
      this.display(); // Re-render settings UI
    } catch (error) {
      console.error('Model discovery failed:', error);
      new Notice('Failed to load models from server');
    }
  }

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // Base URL setting
    new Setting(containerEl)
      .setName('OpenCode Server URL')
      .setDesc('Base URL for the OpenCode server')
      .addText(text => text
        .setPlaceholder('http://localhost:3000')
        .setValue(this.plugin.settings.openCodeBaseUrl || '')
        .onChange(async (value) => {
          this.plugin.settings.openCodeBaseUrl = value;
          await this.plugin.saveData(this.plugin.settings);
        }));

    // Model selection dropdown
    const modelSetting = new Setting(containerEl)
      .setName('Default AI Model')
      .setDesc('Select the default AI model for conversations');

    if (this.models.length === 0) {
      modelSetting.setDesc('No models loaded. Click refresh to load from server.');
    } else {
      const options: Record<string, string> = {};
      this.models.forEach(model => {
        options[model.id] = model.id; // Use ID as both key and display
      });

      modelSetting.addDropdown(dropdown => dropdown
        .addOptions(options)
        .setValue(this.plugin.settings.defaultModelId || '')
        .onChange(async (value) => {
          this.plugin.settings.defaultModelId = value;
          await this.plugin.saveData(this.plugin.settings);
        }));
    }

    // Refresh button
    new Setting(containerEl)
      .addButton(button => button
        .setButtonText('Refresh Models')
        .setCta()
        .onClick(() => this.refreshModels()));
  }
}
```

### 4. Integrate Model Selection in Chat

Update `src/chat-view.ts` to use selected model:

```typescript
export class ChatView extends ItemView {
  async sendMessage(message: string) {
    const selectedModelId = this.plugin.settings.defaultModelId;
    const baseUrl = this.plugin.settings.openCodeBaseUrl || 'http://localhost:3000';

    const request = {
      model: selectedModelId || undefined, // Use selected model or let server choose
      messages: [{ role: 'user', content: message }]
    };

    // Send to OpenCode server using requestUrl
    const response = await requestUrl({
      url: `${baseUrl}/v1/chat/completions`,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(request)
    });

    if (response.status !== 200) {
      throw new Error('Failed to send message');
    }

    const data = response.json;
    // Handle response...
  }
}
```

### 5. Add Persistence

Ensure model selection and base URL are saved in plugin settings:

```typescript
// In settings.ts
async saveSettings() {
  await this.plugin.saveData({
    ...this.plugin.settings,
    defaultModelId: this.selectedModelId,
    openCodeBaseUrl: this.baseUrlInputValue
  });
}
```

## Testing Checklist

- [ ] Base URL configuration saves correctly
- [ ] Model discovery API uses correct /v1/models path with requestUrl
- [ ] Settings UI displays available models from OpenAI-compatible response
- [ ] Model selection persists across restarts
- [ ] Selected model is included in chat requests
- [ ] Graceful handling when model discovery fails
- [ ] Performance: Discovery completes under 5 seconds

## Performance Notes

- Cache model list locally to avoid repeated API calls
- Implement loading states for better UX during model discovery
- Handle network timeouts gracefully
- Support up to 50 models total from server response

## Integration Points

- OpenCode server model discovery endpoint: `GET /v1/models` (OpenAI-compatible)
- Chat completions endpoint: `POST /v1/chat/completions` (OpenAI-compatible)
- Plugin settings persistence via Obsidian API
- Must use `requestUrl` instead of `fetch` to avoid CORS issues