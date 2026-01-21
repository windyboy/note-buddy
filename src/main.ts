import { Plugin, PluginSettingTab, App, Setting } from 'obsidian';

export interface PluginSettings {
	apiEndpoint: string;
	apiKey: string;
	debounceInterval: number;
	maxHistoryLength: number;
}

export const DEFAULT_SETTINGS: PluginSettings = {
	apiEndpoint: 'https://api.opencode.ai',
	apiKey: '',
	debounceInterval: 5000,
	maxHistoryLength: 100,
};

export default class NoteBuddyPlugin extends Plugin {
	settings: PluginSettings = DEFAULT_SETTINGS;

	async onload() {
		console.log('Loading NoteBuddy plugin');

		await this.loadSettings();

		this.addRibbonIcon('brain', 'NoteBuddy', () => {
			console.log('NoteBuddy activated');
		});

		this.addSettingTab(new NoteBuddySettingTab(this.app, this));
	}

	onunload() {
		console.log('Unloading NoteBuddy plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}
}

class NoteBuddySettingTab extends PluginSettingTab {
	plugin: NoteBuddyPlugin;

	constructor(app: App, plugin: NoteBuddyPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		new Setting(containerEl)
			.setName('API Endpoint')
			.setDesc('The OpenCode API endpoint')
			.addText(text => text
				.setPlaceholder('https://api.opencode.ai')
				.setValue(this.plugin.settings.apiEndpoint)
				.onChange(async (value) => {
					this.plugin.settings.apiEndpoint = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('API Key')
			.setDesc('Your OpenCode API key')
			.addText((text) => text
				.setPlaceholder('Enter your API key')
				.setValue(this.plugin.settings.apiKey)
				.onChange(async (value: string) => {
					this.plugin.settings.apiKey = value;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Debounce Interval')
			.setDesc('Debounce interval for saving session history (ms)')
			.addText((text) => text
				.setPlaceholder('5000')
				.setValue(String(this.plugin.settings.debounceInterval))
				.onChange(async (value: string) => {
					this.plugin.settings.debounceInterval = parseInt(value) || 5000;
					await this.plugin.saveSettings();
				}));

		new Setting(containerEl)
			.setName('Max History Length')
			.setDesc('Maximum number of session history items to keep')
			.addText((text) => text
				.setPlaceholder('100')
				.setValue(String(this.plugin.settings.maxHistoryLength))
				.onChange(async (value: string) => {
					this.plugin.settings.maxHistoryLength = parseInt(value) || 100;
					await this.plugin.saveSettings();
				}));
	}
}