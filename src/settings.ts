import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import NoteBuddyPlugin from './main';
import { OpenCodeClient } from './service';
import { ModelDescriptor } from './models';

export class NoteBuddySettingTab extends PluginSettingTab {
  plugin: NoteBuddyPlugin;

  constructor(app: App, plugin: NoteBuddyPlugin) {
    super(app, plugin);
    this.plugin = plugin;
  }

  async display(): Promise<void> {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl('h2', { text: 'NoteBuddy Settings' });

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

    // Load models for dropdown
    let models: ModelDescriptor[] = [];
    try {
      const client = new OpenCodeClient(this.plugin.settings.serviceUrl);
      models = await client.discoverModels();
    } catch (error) {
      // Models discovery failed, show message but continue
      new Notice(`Failed to load models: ${(error as Error).message}`);
    }

    // Auto-select if only one model and none selected
    if (models.length === 1 && !this.plugin.settings.defaultModelId) {
      this.plugin.settings.defaultModelId = models[0].id;
      await this.plugin.saveSettings();
    }

    const modelOptions: Record<string, string> = {};
    modelOptions[''] = 'None (use server default)';
    for (const model of models) {
      modelOptions[model.id] = model.id;
    }

    new Setting(containerEl)
      .setName('Default Model')
      .setDesc('Select the default AI model to use for conversations')
      .addDropdown(dropdown => dropdown
        .addOptions(modelOptions)
        .setValue(this.plugin.settings.defaultModelId || '')
        .onChange(async (value) => {
          this.plugin.settings.defaultModelId = value || undefined;
          await this.plugin.saveSettings();
        })
      );

    new Setting(containerEl)
      .setName('Refresh Models')
      .setDesc('Reload the list of available models from the service')
      .addButton(button => button
        .setButtonText('Refresh')
        .onClick(async () => {
          // Clear cache and reload
          const client = new OpenCodeClient(this.plugin.settings.serviceUrl);
          // Force refresh by clearing cache (implementation detail)
          (client as any).cachedModels = null;
          (client as any).modelsCacheTime = 0;
          await this.display(); // Redisplay to reload
        })
      );
  }
}