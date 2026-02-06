import { App, PluginSettingTab, Setting, Notice } from 'obsidian';
import NoteBuddyPlugin from './main';
import { OpenCodeClient } from './service';
import { Provider } from './models';
import { buildModelOptions } from './utils/model-options';

export class NoteBuddySettingTab extends PluginSettingTab {
  plugin: NoteBuddyPlugin;
  private providers: Provider[] = [];
  private isLoadingModels: boolean = false;
  private lastServiceUrlWarning?: string;

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

    // Connection Settings Group
    const connectionGroup = containerEl.createDiv({ cls: 'nb-settings-group' });
    connectionGroup.createEl('h3', { text: 'Connection Settings', cls: 'nb-settings-group-title' });

    new Setting(connectionGroup)
      .setName('Service URL')
      .setDesc('The URL of the OpenCode service (must include protocol, hostname, and port)')
      .addText(text => text
        .setPlaceholder('http://127.0.0.1:4096')
        .setValue(this.plugin.pluginData.serviceUrl)
        .onChange(async (value) => {
          const previousServiceUrl = this.plugin.pluginData.serviceUrl;
          // Real-time validation
          const validationEl = text.inputEl.parentElement?.querySelector('.nb-settings-validation-error, .nb-settings-validation-success');
          if (validationEl) {
            validationEl.remove();
          }

          if (!value.startsWith('http://') && !value.startsWith('https://')) {
            const errorEl = text.inputEl.parentElement?.createDiv({ cls: 'nb-settings-validation-error' });
            if (errorEl) errorEl.textContent = 'Service URL must start with http:// or https://';
            return;
          }
          try {
            const url = new URL(value);
            if (!url.hostname || url.hostname === '') {
              const errorEl = text.inputEl.parentElement?.createDiv({ cls: 'nb-settings-validation-error' });
              if (errorEl) errorEl.textContent = 'Service URL must include a valid hostname';
              return;
            }
            if (!url.port || url.port === '') {
              const errorEl = text.inputEl.parentElement?.createDiv({ cls: 'nb-settings-validation-error' });
              if (errorEl) errorEl.textContent = 'Service URL must include a port number';
              return;
            }

            // Valid URL
            const successEl = text.inputEl.parentElement?.createDiv({ cls: 'nb-settings-validation-success' });
            if (successEl) successEl.textContent = '✓ Valid URL format';
          } catch (e) {
            const errorEl = text.inputEl.parentElement?.createDiv({ cls: 'nb-settings-validation-error' });
            if (errorEl) errorEl.textContent = 'Service URL must be a valid URL format';
            return;
          }

          if (this.plugin.pluginData.sessions.length > 0 && previousServiceUrl !== value) {
            if (this.lastServiceUrlWarning !== value) {
              new Notice('Active chat detected. Clear the current conversation before switching the Service URL.');
              this.lastServiceUrlWarning = value;
            }
            text.setValue(previousServiceUrl);
            return;
          }

          this.plugin.pluginData.serviceUrl = value;
          await this.plugin.savePluginData();
        })
      );

    new Setting(connectionGroup)
      .setName('Test Connection')
      .setDesc('Test the connection to the service')
      .addButton(button => button
        .setIcon('plug')
        .setButtonText('Test')
        .setCta()
        .onClick(async () => {
          button.setButtonText('Testing...');
          button.setDisabled(true);

          const client = new OpenCodeClient(this.plugin.pluginData.serviceUrl, this.plugin.pluginData.defaultModelId);
          const result = await client.healthCheck();

          button.setButtonText('Test');
          button.setDisabled(false);

          if (result.status === 'connected') {
            new Notice('✓ Connection successful!');
          } else {
            new Notice(`✗ Connection failed: ${result.lastError}`);
          }
        })
      );

    // Model Selection Group
    const modelGroup = containerEl.createDiv({ cls: 'nb-settings-group' });
    modelGroup.createEl('h3', { text: 'Model Selection', cls: 'nb-settings-group-title' });

    // Display model selection dropdown
    this.displayModelSelection(modelGroup);

    // Display refresh button
    this.displayRefreshButton(modelGroup);
  }

  /**
   * Loads available AI providers and models from the OpenCode server.
   *
   * Sets the loading state and updates the providers list. On error, sets providers
   * to an empty array and logs the error. The loading state is always cleared in finally.
   *
   * @param client - Optional OpenCodeClient instance to use (creates new one if not provided)
   * @param forceRefresh - If true, bypasses cache and fetches fresh data from server
   * @throws Error if the server request fails (error is logged and re-thrown)
   */
  private async loadProviders(client?: OpenCodeClient, forceRefresh?: boolean): Promise<void> {
    if (this.isLoadingModels) {
      return;
    }

    this.isLoadingModels = true;

    try {
      const c = client ?? new OpenCodeClient(this.plugin.pluginData.serviceUrl, this.plugin.pluginData.defaultModelId);
      this.providers = await c.getCapabilities(!!forceRefresh);
    } catch (error) {
      // Silently handle error; empty providers means "no models"
      this.providers = [];
      console.error('[NoteBuddy] Failed to load providers:', error);
      throw error;
    } finally {
      this.isLoadingModels = false;
    }
  }

  /**
   * Displays the model selection dropdown in the settings UI.
   *
   * Builds a dropdown with options in "Provider Name - Model Name" format, including
   * a "Use server default" option. The current selection is restored from settings,
   * and changes are immediately persisted via plugin.saveSettings().
   *
   * @param containerEl - The HTML element to add the dropdown setting to
   */
  private displayModelSelection(containerEl: HTMLElement): void {
    // Build dropdown options from providers
    const modelOptions = buildModelOptions(this.providers);

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
            this.plugin.pluginData.defaultModelId = value;
          } else {
            this.plugin.pluginData.defaultModelId = undefined;
          }
          await this.plugin.savePluginData();
        })
      );
  }

  private getCurrentModelSelection(): string {
    return this.plugin.pluginData.defaultModelId || '';
  }

  private displayRefreshButton(container: HTMLElement): void {
    new Setting(container)
      .setName('Refresh Models')
      .setDesc('Reload the list of available models from the service')
      .addButton(button => button
        .setIcon('refresh-cw')
        .setButtonText('Refresh')
        .onClick(async () => {
          const client = new OpenCodeClient(this.plugin.pluginData.serviceUrl, this.plugin.pluginData.defaultModelId);
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
