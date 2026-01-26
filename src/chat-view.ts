import { ItemView, WorkspaceLeaf } from 'obsidian';

export const VIEW_TYPE_CHAT = 'note-buddy-chat-view';

export class ChatView extends ItemView {
  constructor(leaf: WorkspaceLeaf, private plugin: any) {
    super(leaf);
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
    messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
    `;

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

    const sendMessage = () => {
      const message = textarea.value.trim();
      if (!message) return;

      console.log('[NoteBuddy] Message sent:', message);
      textarea.value = '';
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
}
