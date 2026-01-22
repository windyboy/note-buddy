import { App, PluginSettingTab, Setting, Notice } from "obsidian";
import NoteBuddyPlugin from "../main";
import { OpencodeService } from "../services/opencode-service";

export class NoteBuddySettingTab extends PluginSettingTab {
  plugin: NoteBuddyPlugin;
  private opencodeService: OpencodeService;

  constructor(
    app: App,
    plugin: NoteBuddyPlugin,
    opencodeService: OpencodeService,
  ) {
    super(app, plugin);
    this.plugin = plugin;
    this.opencodeService = opencodeService;
  }

  display(): void {
    const { containerEl } = this;
    containerEl.empty();

    containerEl.createEl("h2", { text: "NoteBuddy Settings" });

    new Setting(containerEl)
      .setName("Server URL")
      .setDesc("Opencode server endpoint")
      .addText((text) =>
        text
          .setPlaceholder("http://localhost:8080")
          .setValue(this.plugin.settings.serverUrl)
          .onChange(async (value) => {
            this.plugin.settings.serverUrl = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("API Key")
      .setDesc("Bearer token for authentication")
      .addText((text) =>
        text
          .setPlaceholder("Enter API Key")
          .setValue(this.plugin.settings.apiKey)
          .onChange(async (value) => {
            this.plugin.settings.apiKey = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Health Check")
      .setDesc("Test connection to the server")
      .addButton((button) =>
        button.setButtonText("Test Connection").onClick(async () => {
          const isHealthy = await this.opencodeService.checkHealth();
          if (isHealthy) {
            new Notice("Connected to Opencode server successfully!");
          } else {
            new Notice(
              "Failed to connect to Opencode server. Check URL and Key.",
            );
          }
        }),
      );

    new Setting(containerEl)
      .setName("Auto Archive")
      .setDesc("Automatically archive old sessions")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.autoArchive)
          .onChange(async (value) => {
            this.plugin.settings.autoArchive = value;
            await this.plugin.saveSettings();
          }),
      );

    new Setting(containerEl)
      .setName("Debug Mode")
      .setDesc("Enable detailed logging in console")
      .addToggle((toggle) =>
        toggle
          .setValue(this.plugin.settings.debugMode)
          .onChange(async (value) => {
            this.plugin.settings.debugMode = value;
            await this.plugin.saveSettings();
          }),
      );
  }
}
