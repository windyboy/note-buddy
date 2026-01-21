import { Notice, WorkspaceLeaf, ItemView } from 'obsidian';
import { SessionManager } from '../models/session';
import { OpenCodeClient } from '../services/opencode-client';
import { PluginSettings, MessageType } from '../models/types';

export const VIEW_TYPE_NOTE_BUDDY = 'note-buddy-view';

export class NoteBuddyView extends ItemView {
	private sessionManager: SessionManager;
	private client: OpenCodeClient;
	private settings: PluginSettings;
	private currentSessionId: string = '';
	private messagesDiv: HTMLElement | null = null;

	constructor(
		leaf: WorkspaceLeaf,
		sessionManager: SessionManager,
		client: OpenCodeClient,
		settings: PluginSettings,
	) {
		super(leaf);
		this.sessionManager = sessionManager;
		this.client = client;
		this.settings = settings;
		this.currentSessionId = sessionManager.createSession().id;
	}

	getDisplayText(): string {
		return 'NoteBuddy';
	}

	getViewType(): string {
		return VIEW_TYPE_NOTE_BUDDY;
	}

	async onOpen(): Promise<void> {
		const container = this.containerEl.children[1];
		container.empty();
		container.createEl('h2', { text: 'NoteBuddy Chat' });

		const chatContainer = container.createDiv({ cls: 'notebuddy-chat' });
		this.messagesDiv = chatContainer.createDiv({ cls: 'notebuddy-messages' });
		const inputContainer = chatContainer.createDiv({ cls: 'notebuddy-input' });

		const input = inputContainer.createEl('textarea', {
			cls: 'notebuddy-textarea',
			attr: { placeholder: 'Type your message...' },
		});

		const sendBtn = inputContainer.createEl('button', {
			text: 'Send',
			cls: 'notebuddy-send-btn',
		});

		sendBtn.onclick = async () => {
			const message = input.value.trim();
			if (!message) return;

			this.appendMessage('user', message);
			this.sessionManager.addMessage(this.currentSessionId, MessageType.User, message);
			input.value = '';

			try {
				new Notice('Sending message...');
				const response = await this.client.sendMessage(
					this.currentSessionId,
					message,
					(chunk) => {
						this.updateLastMessage(chunk);
					},
				);

				this.appendMessage('assistant', response.content);
				this.sessionManager.addMessage(this.currentSessionId, MessageType.Assistant, response.content);
			} catch (error) {
				new Notice(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`);
			}
		};
	}

	async onClose(): Promise<void> {}

	private appendMessage(role: 'user' | 'assistant', content: string): void {
		if (!this.messagesDiv) return;
		const messageEl = this.messagesDiv.createDiv({ cls: `notebuddy-message notebuddy-${role}` });
		messageEl.createDiv({ cls: 'notebuddy-message-role', text: role === 'user' ? 'You' : 'AI' });
		messageEl.createDiv({ cls: 'notebuddy-message-content', text: content });
	}

	private updateLastMessage(chunk: string): void {
		if (!this.messagesDiv) return;
		const lastMessage = this.messagesDiv.lastElementChild;
		if (lastMessage) {
			const contentDiv = lastMessage.querySelector('.notebuddy-message-content');
			if (contentDiv) {
				contentDiv.textContent += chunk;
			}
		}
	}
}