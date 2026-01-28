import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import NoteBuddyPlugin from './main';
import { OpenCodeClient } from './service';
import { Provider } from './models';

export class NoteBuddySettingTab extends PluginSettingTab {
  plugin: NoteBuddyPlugin;
  private providers: Provider[] = [];
  private isLoadingModels: boolean = false;

  constructor(app: App, plugin: NoteBuddyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(useCachedProviders?: boolean): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'NoteBuddy Settings' });

    // Load providers from capabilities endpoint unless using cached (e.g. after Refresh)
    if (!useCachedProviders) {
      try {
        await this.loadProviders();
      } catch {
        // Already handled in loadProviders (this.providers = []); continue to render
      }
    }

    new Setting(containerEl)
      .setName('Service URL')
      .setDesc('The URL of the OpenCode service (must include protocol, hostname, and port)')
      .addText(text => text
        .setPlaceholder('http://127.0.0.1:4096')
        .setValue(this.plugin.settings.serviceUrl)
        .onChange(async (value) => {
          // Basic validation
          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            new Notice('Service URL must start with http:// or https://');
            return;
          }
          try {
            const url = new URL(value);
            if (!url.hostname || url.hostname === '') {
              new Notice('Service URL must include a valid hostname');
              return;
            }
            if (!url.port || url.port === '') {
              new Notice('Service URL must include a port number');
              return;
            }
          } catch (e) {
            new Notice('Service URL must be a valid URL format');
            return;
          }
          this.plugin.settings.serviceUrl = value;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Test Connection')
      .setDesc('Test the connection to the service')
      .addButton(button => button
        .setButtonText('Test')
        .setCta()
        .onClick(async () => {
          const client = new OpenCodeClient(this.plugin.settings.serviceUrl, this.plugin.settings.defaultModelId);
          const result = await client.healthCheck();
          if (result.status === 'connected') {
            new Notice('Connection successful!');
          } else {
            new Notice(`Connection failed: ${result.lastError}`);
          }
        })
      );

    // Display model selection dropdown
    this.displayModelSelection(containerEl);

    // Display refresh button
    this.displayRefreshButton(containerEl);
  }

  private async loadProviders(client?: OpenCodeClient, forceRefresh?: boolean): Promise<void> {
    if (this.isLoadingModels) {
      return;
    }

    this.isLoadingModels = true;

    try {
      const c = client ?? new OpenCodeClient(this.plugin.settings.serviceUrl, this.plugin.settings.defaultModelId);
      this.providers = await c.getCapabilities(forceRefresh ?? false);
    } catch (error) {
      // Silently handle error; empty providers means "no models"
      this.providers = [];
      console.error('[NoteBuddy] Failed to load providers:', error);
      throw error;
    } finally {
      this.isLoadingModels = false;
    }
  }

  private displayModelSelection(containerEl: HTMLElement): void {
    // Build dropdown options from providers
    const modelOptions: Record<string, string> = {};
    modelOptions[''] = 'Use server default';

    for (const provider of this.providers) {
      for (const model of provider.models) {
        const value = `${provider.id}/${model.id}`;
        modelOptions[value] = `${provider.name} - ${model.name}`;
      }
    }

    // Get current selection (could be old format or new format)
    const currentValue = this.getCurrentModelSelection();

    new Setting(containerEl)
      .setName('Default Model')
      .setDesc('Select the default AI model to use for conversations')
      .addDropdown(dropdown => dropdown
        .addOptions(modelOptions)
        .setValue(currentValue)
        .onChange(async (value) => {
          if (value) {
            this.plugin.settings.defaultModelId = value;
          } else {
            this.plugin.settings.defaultModelId = undefined;
          }
          await this.plugin.saveSettings();
        })
      );
  }

  private getCurrentModelSelection(): string {
    return this.plugin.settings.defaultModelId || '';
  }

  private displayRefreshButton(container: HTMLElement): void {
    new Setting(container)
      .setName('Refresh Models')
      .setDesc('Reload the list of available models from the service')
      .addButton(button => button
        .setButtonText('Refresh')
        .onClick(async () => {
          const client = new OpenCodeClient(this.plugin.settings.serviceUrl, this.plugin.settings.defaultModelId);
          client.clearModelsCache();
          try {
            await this.loadProviders(client, true);
            new Notice('Models refreshed');
            await this.display(true);
          } catch (error) {
            console.error('[NoteBuddy] Failed to load providers:', error);
            new Notice(`Failed to refresh models: ${(error as Error).message}`);
            await this.display(true);
          }
        })
      );
  }
}