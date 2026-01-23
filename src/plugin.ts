import { Plugin, PluginSettingTab, Setting, App, MarkdownView, Editor, Notice, MarkdownFileInfo } from 'obsidian';
import { NoteAssistantSettings, DEFAULT_SETTINGS } from './models/settings';
import { OpenCodeClient } from './services/opencode-client';
import { OperationQueue } from './services/operation-queue';
import { VaultCache } from './services/vault-cache';
import { TFile } from 'obsidian';
import { summarizeCommand } from './commands/summarize';
import { extractTasksCommand } from './commands/extract-tasks';
import { improveStructureCommand } from './commands/improve-structure';
import { suggestLinksCommand } from './commands/suggest-links';

export default class NoteAssistantPlugin extends Plugin {
	settings: NoteAssistantSettings = DEFAULT_SETTINGS;
	opencodeClient!: OpenCodeClient;
	operationQueue!: OperationQueue;
	vaultCache!: VaultCache;
	private serviceAvailable: boolean = true;
	private lastHealthCheck: number = 0;
	private readonly HEALTH_CHECK_INTERVAL = 60000; // 1 minute

	async onload() {
		await this.loadSettings();

		// Initialize services
		this.opencodeClient = new OpenCodeClient(this.settings.opencodeEndpoint);
		this.operationQueue = new OperationQueue(this.opencodeClient);
		this.vaultCache = new VaultCache(this.app.vault);

		// Register vault events for cache updates
		this.registerEvent(
			this.app.vault.on('create', (file) => {
				if (file instanceof TFile && file.extension === 'md') {
					this.vaultCache.add(file);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('delete', (file) => {
				if (file instanceof TFile) {
					this.vaultCache.remove(file.path);
				}
			})
		);

		this.registerEvent(
			this.app.vault.on('rename', (file, oldPath) => {
				if (file instanceof TFile) {
					this.vaultCache.update(oldPath, file);
				}
			})
		);

		// Register commands
		this.registerCommands();

		// Add settings tab
		this.addSettingTab(new NoteAssistantSettingTab(this.app, this));

		// Health check on load
		this.checkHealth();
	}

	onunload() {
		console.log('Unloading Note Assistant plugin');
	}

	async loadSettings() {
		this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
	}

	async saveSettings() {
		await this.saveData(this.settings);
	}

	registerCommands() {
		// Summarize command
		this.addCommand({
			id: 'summarize-note',
			name: 'Note Assistant: Summarize',
			editorCallback: async (editor: Editor, ctx: any) => {
				// Check if service is available before executing
				if (!(await this.isServiceAvailable())) {
					this.showOfflineError();
					return;
				}
				if (ctx && 'file' in ctx) {
					summarizeCommand(this, editor, ctx as MarkdownView);
				}
			}
		});

		// Extract Tasks command
		this.addCommand({
			id: 'extract-tasks',
			name: 'Note Assistant: Extract Tasks',
			editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				// Check if service is available before executing
				if (!(await this.isServiceAvailable())) {
					this.showOfflineError();
					return;
				}
				if (ctx instanceof MarkdownView) {
					extractTasksCommand(this, editor, ctx);
				}
			}
		});

		// Improve Structure command
		this.addCommand({
			id: 'improve-structure',
			name: 'Note Assistant: Improve Structure',
			editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				// Check if service is available before executing
				if (!(await this.isServiceAvailable())) {
					this.showOfflineError();
					return;
				}
				if (ctx instanceof MarkdownView) {
					improveStructureCommand(this, editor, ctx);
				}
			}
		});

		// Suggest Links command
		this.addCommand({
			id: 'suggest-links',
			name: 'Note Assistant: Suggest Links',
			editorCallback: async (editor: Editor, ctx: MarkdownView | MarkdownFileInfo) => {
				// Check if service is available before executing
				if (!(await this.isServiceAvailable())) {
					this.showOfflineError();
					return;
				}
				if (ctx instanceof MarkdownView) {
					suggestLinksCommand(this, editor, ctx);
				}
			}
		});
	}

	private async checkHealth(): Promise<boolean> {
		try {
			await this.opencodeClient.healthCheck();
			this.serviceAvailable = true;
			this.lastHealthCheck = Date.now();
			return true;
		} catch (error) {
			this.serviceAvailable = false;
			this.lastHealthCheck = Date.now();
			console.warn('OpenCode service health check failed:', error);
			return false;
		}
	}

	private async isServiceAvailable(): Promise<boolean> {
		// Check if health check is stale (older than interval)
		const now = Date.now();
		if (now - this.lastHealthCheck > this.HEALTH_CHECK_INTERVAL) {
			// Perform fresh health check
			return await this.checkHealth();
		}
		// Use cached result
		return this.serviceAvailable;
	}

	private showOfflineError() {
		const errorMsg = 'Cannot connect to OpenCode service. Please check that the service is running and verify the endpoint in settings.';
		new Notice(errorMsg, 5000);
		console.error(errorMsg);
	}

	getActiveEditor(): { editor: Editor; view: MarkdownView } | null {
		const view = this.app.workspace.getActiveViewOfType(MarkdownView);
		if (!view) return null;
		return { editor: view.editor, view };
	}

	getSelectedText(editor: Editor): string | null {
		const selection = editor.getSelection();
		return selection || null;
	}
}

class NoteAssistantSettingTab extends PluginSettingTab {
	plugin: NoteAssistantPlugin;

	constructor(app: App, plugin: NoteAssistantPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;
		containerEl.empty();

		containerEl.createEl('h2', { text: 'Note Assistant Settings' });

		// OpenCode Endpoint
		new Setting(containerEl)
			.setName('OpenCode Endpoint')
			.setDesc('The URL of your OpenCode service (e.g., http://localhost:8000)')
			.addText(text => text
				.setPlaceholder('http://localhost:8000')
				.setValue(this.plugin.settings.opencodeEndpoint)
				.onChange(async (value) => {
					// Basic URL validation
					if (value && (value.startsWith('http://') || value.startsWith('https://'))) {
						this.plugin.settings.opencodeEndpoint = value;
						this.plugin.opencodeClient = new OpenCodeClient(value);
						await this.plugin.saveSettings();
					}
				}));

		// Test Connection button
		new Setting(containerEl)
			.setName('Test Connection')
			.setDesc('Verify that OpenCode service is accessible')
			.addButton(button => button
				.setButtonText('Test')
				.onClick(async () => {
					try {
						await this.plugin.opencodeClient.healthCheck();
						button.setButtonText('✓ Connected');
						setTimeout(() => button.setButtonText('Test'), 2000);
					} catch (error) {
						button.setButtonText('✗ Failed');
						setTimeout(() => button.setButtonText('Test'), 2000);
					}
				}));

		// Timeout
		new Setting(containerEl)
			.setName('Request Timeout')
			.setDesc('Timeout for API requests in milliseconds')
			.addText(text => text
				.setPlaceholder('30000')
				.setValue(String(this.plugin.settings.timeout))
				.onChange(async (value) => {
					const timeout = parseInt(value) || 30000;
					this.plugin.settings.timeout = timeout;
					await this.plugin.saveSettings();
				}));

		// Show Confidence
		new Setting(containerEl)
			.setName('Show Confidence Scores')
			.setDesc('Display confidence scores for AI suggestions')
			.addToggle(toggle => toggle
				.setValue(this.plugin.settings.showConfidence)
				.onChange(async (value) => {
					this.plugin.settings.showConfidence = value;
					await this.plugin.saveSettings();
				}));
	}
}
