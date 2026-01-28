# Quickstart Guide: Model Selection via OpenCode Server

**Feature**: specs/003-opencode-provider-config/spec.md
**Date**: 2026-01-28 (Updated)

## Overview

This guide provides implementation steps for adding model selection functionality to the NoteBuddy Obsidian plugin. Users can discover available providers and models from a local OpenCode server, select a default model, and have that selection persist across restarts.

## Prerequisites

- NoteBuddy plugin project with Obsidian API integration
- Local OpenCode server running at http://127.0.0.1:4096 (from spec 002)
- TypeScript 5.x development environment (strict mode)
- Bun runtime for development and testing
- Existing OpenCodeClient service (src/service.ts)

## Implementation Steps

### 1. Define Model Types

Add types for providers and models in `src/models.ts`:

```typescript
export interface Provider {
  id: string;
  name: string;
  models: Model[];
}

export interface Model {
  id: string;
  name: string;
}

export interface ModelSelection {
  providerID: string;
  modelID: string;
}

export interface NoteBuddySettings {
  serviceUrl: string;
  defaultModel?: ModelSelection;
}
```

### 2. Implement Model Discovery Service

Extend `OpenCodeClient` in `src/service.ts` with capabilities discovery:

```typescript
import { requestUrl } from 'obsidian';

const MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

export class OpenCodeClient {
  private modelsCache: {
    data: Provider[] | null;
    timestamp: number;
  } = { data: null, timestamp: 0 };

  async getCapabilities(): Promise<Provider[]> {
    // Check cache validity
    if (this.isCacheValid()) {
      return this.modelsCache.data!;
    }

    try {
      const response = await requestUrl({
        url: `${this.plugin.settings.serviceUrl}/v1/capabilities`,
        method: 'GET',
        throw: false
      });

      if (response.status !== 200) {
        throw new Error('Failed to fetch capabilities');
      }

      const data = response.json;
      this.modelsCache = {
        data: data.providers,
        timestamp: Date.now()
      };

      return data.providers;
    } catch (error) {
      console.error('[NoteBuddy] Capabilities discovery failed:', error);
      throw error;
    }
  }

  private isCacheValid(): boolean {
    return this.modelsCache.data !== null &&
           Date.now() - this.modelsCache.timestamp < MODELS_CACHE_TTL;
  }

  clearModelsCache(): void {
    this.modelsCache = { data: null, timestamp: 0 };
  }
}
```

### 3. Create Settings UI

Extend `NoteBuddySettingTab` in `src/settings.ts` to include model selection:

```typescript
export class NoteBuddySettingTab extends PluginSettingTab {
  private providers: Provider[] = [];
  private isLoadingModels = false;

  async refreshModels() {
    if (this.isLoadingModels) return;

    this.isLoadingModels = true;
    this.display(); // Show loading state

    try {
      this.plugin.client.clearModelsCache();
      this.providers = await this.plugin.client.getCapabilities();
      new Notice('Models refreshed successfully');
    } catch (error) {
      console.error('[NoteBuddy] Model refresh failed:', error);
      new Notice('Failed to load models. Check service URL.');
    } finally {
      this.isLoadingModels = false;
      this.display(); // Update UI
    }
  }
```

  display() {
    const { containerEl } = this;
    containerEl.empty();

    // Service URL setting (existing)
    new Setting(containerEl)
      .setName('OpenCode Service URL')
      .setDesc('URL of the OpenCode server')
      .addText(text => text
        .setPlaceholder('http://127.0.0.1:4096')
        .setValue(this.plugin.settings.serviceUrl)
        .onChange(async (value) => {
          this.plugin.settings.serviceUrl = value;
          await this.plugin.saveSettings();
        }));

    // Refresh Models button
    new Setting(containerEl)
      .setName('Model Discovery')
      .setDesc('Load available models from the server')
      .addButton(button => button
        .setButtonText(this.isLoadingModels ? 'Loading...' : 'Refresh Models')
        .setDisabled(this.isLoadingModels)
        .onClick(() => this.refreshModels()));

    // Model selection dropdown
    this.addModelSelectionDropdown(containerEl);
  }

  private addModelSelectionDropdown(containerEl: HTMLElement) {
    const modelSetting = new Setting(containerEl)
      .setName('Default AI Model')
      .setDesc('Select the default model for chat');

    if (this.providers.length === 0) {
      modelSetting.setDesc('No models loaded. Click "Refresh Models" to load from server.');
      return;
    }

    // Build dropdown options with provider/model hierarchy
    const options: Record<string, string> = { '': 'Use server default' };
    this.providers.forEach(provider => {
      provider.models.forEach(model => {
        const key = `${provider.id}/${model.id}`;
        const label = `${provider.name} / ${model.name}`;
        options[key] = label;
      });
    });

    // Get current selection
    const currentValue = this.plugin.settings.defaultModel
      ? `${this.plugin.settings.defaultModel.providerID}/${this.plugin.settings.defaultModel.modelID}`
      : '';

    modelSetting.addDropdown(dropdown => dropdown
      .addOptions(options)
      .setValue(currentValue)
      .onChange(async (value) => {
        if (value === '') {
          this.plugin.settings.defaultModel = undefined;
        } else {
          const [providerID, modelID] = value.split('/');
          this.plugin.settings.defaultModel = { providerID, modelID };
        }
        await this.plugin.saveSettings();
      }));
  }
}
```

### 4. Integrate Model Selection in Chat

Update `OpenCodeClient.sendMessage()` in `src/service.ts` to include selected model:

```typescript
async sendMessage(sessionId: string, message: string): Promise<string> {
  const payload: any = {
    role: "user",
    content: message
  };

  // Include selected model if configured
  if (this.plugin.settings.defaultModel) {
    payload.providerID = this.plugin.settings.defaultModel.providerID;
    payload.modelID = this.plugin.settings.defaultModel.modelID;
  }

  const response = await requestUrl({
    url: `${this.plugin.settings.serviceUrl}/v1/sessions/${sessionId}/messages`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
    throw: false
  });

  if (response.status !== 200) {
    throw new Error('Failed to send message');
  }

  return response.json.content;
}
```

### 5. Handle Model Unavailability

Add fallback logic when selected model is unavailable:

```typescript
// In OpenCodeClient.sendMessage()
try {
  const response = await requestUrl({...});

  if (response.status === 404 && this.plugin.settings.defaultModel) {
    // Model not found, fall back to server default
    new Notice('Selected model unavailable. Using server default.');
    this.plugin.settings.defaultModel = undefined;
    await this.plugin.saveSettings();

    // Retry without model selection
    return this.sendMessage(sessionId, message);
  }

  return response.json.content;
} catch (error) {
  console.error('[NoteBuddy] Send message failed:', error);
  throw error;
}
```

## Testing Checklist

- [ ] Service URL configuration saves correctly
- [ ] Model discovery calls `/v1/capabilities` endpoint
- [ ] Settings UI displays providers and models in hierarchy
- [ ] Model selection persists across Obsidian restarts
- [ ] Selected model included in message payloads as `{ providerID, modelID }`
- [ ] Graceful handling when model discovery fails
- [ ] Loading indicator shows during discovery
- [ ] Fallback to server default when selected model unavailable
- [ ] Performance: Discovery completes under 5 seconds
- [ ] Cache invalidation works correctly (5-minute TTL)

## Performance Notes

- Cache model list with 5-minute TTL to avoid repeated API calls
- Manual refresh gives users control over when to check for new models
- Loading indicator provides feedback without blocking UI
- Handle network timeouts gracefully (10-second timeout)
- Support up to 50 models per provider from server response
- Async discovery doesn't block settings UI

## Integration Points

- OpenCode server capabilities endpoint: `GET /v1/capabilities`
- Session messages endpoint: `POST /v1/sessions/{sessionId}/messages`
- Plugin settings persistence via Obsidian API
- Must use `requestUrl` instead of `fetch` (Obsidian requirement)
- Model format: `{ providerID, modelID }` in message payload
- Default service URL: `http://127.0.0.1:4096`

## Key Design Decisions

- **Provider hierarchy**: Models grouped by provider for clarity
- **Manual refresh**: User controls when to check for new models
- **5-minute cache**: Balances freshness with performance
- **Optional selection**: Undefined means use server default
- **Non-blocking errors**: Notifications don't interrupt workflow
- **Graceful degradation**: Plugin works without model selection