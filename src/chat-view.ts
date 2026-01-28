import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import { OpenCodeClient } from './service';
import { MessagePart, SendMessage, MessageResponse } from './models';

export const VIEW_TYPE_CHAT = 'note-buddy-chat-view';

export class ChatView extends ItemView {
  private client: OpenCodeClient;
  private messages: MessagePart[] = [];
  private messagesContainer!: HTMLElement;

  constructor(leaf: WorkspaceLeaf, private plugin: any) {
    super(leaf);
    this.client = new OpenCodeClient(
      plugin.settings.serviceUrl,
      plugin.settings.defaultModelId,
      plugin.onModelUnavailable?.bind(plugin)
    );
  }

  getViewType() {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText() {
    return 'NoteBuddy Chat';
  }

  async onOpen() {
    const container = this.containerEl.children[1];
    container.empty();

    const chatContainer = container.createDiv({ cls: 'nb-chat-container' });
    chatContainer.style.cssText = `
      display: flex;
      flex-direction: column;
      height: 100%;
      gap: 1rem;
    `;

    const messagesContainer = chatContainer.createDiv({ cls: 'nb-messages-container' });
    this.messagesContainer = messagesContainer;
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
    `;

    this.renderMessages();

    const welcomeMessage = messagesContainer.createDiv({ cls: 'nb-message nb-message-system' });
    welcomeMessage.createSpan({ text: 'Welcome to NoteBuddy! Chat with your notes here.' });
    welcomeMessage.style.cssText = `
      padding: 0.75rem;
      background-color: var(--background-secondary);
      border-radius: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    `;

    const inputContainer = chatContainer.createDiv({ cls: 'nb-input-container' });
    inputContainer.style.cssText = `
      display: flex;
      gap: 0.5rem;
      padding: 1rem;
      border-top: 1px solid var(--background-modifier-border);
    `;

    const textarea = inputContainer.createEl('textarea', {
      cls: 'nb-chat-input',
      attr: { placeholder: 'Type your message...' },
    });
    textarea.style.cssText = `
      flex: 1;
      min-height: 60px;
      max-height: 150px;
      padding: 0.5rem;
      border: 1px solid var(--background-modifier-border);
      border-radius: 0.375rem;
      background-color: var(--background-primary);
      color: var(--text-normal);
      resize: vertical;
      font-family: inherit;
    `;

    const sendButton = inputContainer.createEl('button', {
      cls: 'nb-send-button',
      text: 'Send',
    });
    sendButton.style.cssText = `
      padding: 0.5rem 1rem;
      background-color: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    `;

    const sendMessage = async () => {
      const message = textarea.value.trim();
      if (!message) return;

      // Add user message
      this.messages.push({ text: message, role: 'user', type: 'text' });
      this.renderMessages();

      textarea.value = '';

      try {
        // Ensure session exists
        if (!this.plugin.sessionState) {
          this.plugin.sessionState = await this.client.createSession();
        }

        // Send message
const sendData: SendMessage = {
  parts: [{ text: message, role: 'user', type: 'text' }],
};

        // Set model if defaultModelId is configured
        if (this.plugin.settings.defaultModelId) {
          const parts = this.plugin.settings.defaultModelId.split('/');
          if (parts.length === 2) {
            sendData.model = {
              providerID: parts[0],
              modelID: parts[1],
            };
          }
        }

        let response: MessageResponse;
        try {
          response = await this.client.sendMessageToSession(this.plugin.sessionState.sessionID, sendData);
        } catch (sendError) {
          const err = sendError as Error;
          if (err.message.includes('Session not found') || err.message.includes('404')) {
            // Create new session and retry once
            this.plugin.sessionState = await this.client.createSession();
            response = await this.client.sendMessageToSession(this.plugin.sessionState.sessionID, sendData);
          } else {
            throw sendError;
          }
        }

        // Add assistant response
        this.messages.push(...response.parts);
        this.renderMessages();

        // Scroll to bottom
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
      } catch (error) {
        console.error('[NoteBuddy] Send failed:', error);
        new Notice(`Failed to send message: ${(error as Error).message}`);
      }
    };

    sendButton.onclick = sendMessage;
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  async onClose() {
    console.log('[NoteBuddy] Chat view closed');
  }

  private renderMessages() {
    this.messagesContainer.empty();

    if (this.messages.length === 0) {
      const welcomeMessage = this.messagesContainer.createDiv({ cls: 'nb-message nb-message-system' });
      welcomeMessage.createSpan({ text: 'Welcome to NoteBuddy! Chat with your notes here.' });
      welcomeMessage.style.cssText = `
        padding: 0.75rem;
        background-color: var(--background-secondary);
        border-radius: 0.5rem;
        font-size: 0.9rem;
        color: var(--text-muted);
      `;
      return;
    }

    for (const message of this.messages) {
      const messageEl = this.messagesContainer.createDiv({
        cls: `nb-message nb-message-${message.role}`,
      });
      messageEl.createSpan({ text: message.text });
      messageEl.style.cssText = `
        padding: 0.75rem;
        background-color: ${message.role === 'user' ? 'var(--background-modifier-accent)' : 'var(--background-secondary)'};
        border-radius: 0.5rem;
        font-size: 0.9rem;
        align-self: ${message.role === 'user' ? 'flex-end' : 'flex-start'};
        max-width: 70%;
      `;
    }
  }
}
