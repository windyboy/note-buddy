import { ItemView, WorkspaceLeaf, Notice } from 'obsidian';
import NoteBuddyPlugin from './main';
import { OpenCodeClient } from './service';
import { ChatSession, ChatMessage, Provider, trimSessionMessages } from './models';
import { buildModelOptions } from './utils/model-options';

export const VIEW_TYPE_CHAT = 'note-buddy-chat-view';

export class ChatView extends ItemView {
  private client: OpenCodeClient;
  private activeSession: ChatSession | undefined;
  private chatInput: HTMLTextAreaElement | undefined;
  private sendButton!: HTMLButtonElement;
  private messagesContainer!: HTMLElement;
  private sessionListContainer!: HTMLElement;
  private modelSelect!: HTMLSelectElement;
  private isStreaming = false;
  private currentAbortController: AbortController | null = null;
  private currentReply = '';
  private providers: Provider[] = [];
  private messageElements = new Map<string, HTMLElement>();

  constructor(leaf: WorkspaceLeaf, private plugin: NoteBuddyPlugin) {
    super(leaf);
    this.client = new OpenCodeClient(
      plugin.pluginData.serviceUrl,
      plugin.pluginData.defaultModelId,
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
    await this.loadChatState();
    await this.loadProviders();

    const container = this.containerEl.children[1];
    container.empty();

    const mainContainer = this.buildLayout(container as HTMLElement);
    this.initSidebar(mainContainer);
    this.initChatPanel(mainContainer);

    this.populateModelSelect();
    this.renderMessages();
    this.renderSessionList();
  }

  async onClose() {
    if (this.currentAbortController) {
      this.currentAbortController.abort();
    }
    console.log('[NoteBuddy] Chat view closed');
  }

  private buildLayout(container: HTMLElement): HTMLElement {
    const mainContainer = container.createDiv({ cls: 'nb-main-container' });
    mainContainer.style.cssText = `
      display: flex;
      height: 100%;
      gap: 0;
    `;
    return mainContainer;
  }

  private initSidebar(mainContainer: HTMLElement): void {
    const sidebar = mainContainer.createDiv({ cls: 'nb-sidebar' });
    sidebar.style.cssText = `
      width: 250px;
      border-right: 1px solid var(--background-modifier-border);
      display: flex;
      flex-direction: column;
      background-color: var(--background-secondary);
    `;

    const sidebarHeader = sidebar.createDiv({ cls: 'nb-sidebar-header' });
    sidebarHeader.style.cssText = `
      padding: 1rem;
      border-bottom: 1px solid var(--background-modifier-border);
    `;
    sidebarHeader.createEl('h3', { text: 'Sessions', cls: 'nb-sidebar-title' });

    this.sessionListContainer = sidebar.createDiv({ cls: 'nb-session-list' });
    this.sessionListContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
    `;

    const newSessionButton = sidebar.createDiv({ cls: 'nb-new-session-button' });
    newSessionButton.style.cssText = `
      padding: 1rem;
      border-top: 1px solid var(--background-modifier-border);
    `;
    const button = newSessionButton.createEl('button', {
      cls: 'nb-new-session-btn',
      text: '+ New Session',
    });
    button.style.cssText = `
      width: 100%;
      padding: 0.5rem;
      background-color: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    `;
    button.onclick = () => this.onNewSession();
  }

  private initChatPanel(mainContainer: HTMLElement): void {
    const chatContainer = mainContainer.createDiv({ cls: 'nb-chat-container' });
    chatContainer.style.cssText = `
      flex: 1;
      display: flex;
      flex-direction: column;
      height: 100%;
    `;

    const header = chatContainer.createDiv({ cls: 'nb-chat-header' });
    this.initHeader(header);

    this.messagesContainer = chatContainer.createDiv({ cls: 'nb-messages-container' });
    this.messagesContainer.style.cssText = `
      flex: 1;
      overflow-y: auto;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem;
    `;

    const inputContainer = chatContainer.createDiv({ cls: 'nb-input-container' });
    this.initInput(inputContainer);
  }

  private initHeader(header: HTMLElement): void {
    header.style.cssText = `
      padding: 1rem;
      border-bottom: 1px solid var(--background-modifier-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
    `;

    const sessionInfo = header.createDiv({ cls: 'nb-session-info' });
    sessionInfo.style.cssText = `
      flex: 1;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    sessionInfo.createEl('span', { cls: 'nb-session-title', text: this.activeSession?.name || 'Chat' });

    const modelContainer = header.createDiv({ cls: 'nb-model-container' });
    modelContainer.style.cssText = `
      display: flex;
      align-items: center;
      gap: 0.5rem;
    `;
    this.modelSelect = modelContainer.createEl('select', { cls: 'nb-model-select' });
    this.modelSelect.style.cssText = `
      padding: 0.25rem 0.5rem;
      border: 1px solid var(--background-modifier-border);
      border-radius: 0.25rem;
      background-color: var(--background-primary);
      color: var(--text-normal);
      font-size: 0.85rem;
    `;
    this.modelSelect.onchange = () => this.onModelChange();

    const deleteButton = header.createEl('button', {
      cls: 'nb-delete-session-btn',
      text: 'Delete Session',
    });
    deleteButton.style.cssText = `
      padding: 0.5rem;
      background-color: var(--background-modifier-error);
      color: var(--text-on-accent);
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
      font-size: 0.8rem;
    `;
    deleteButton.onclick = () => this.onDeleteSession();
  }

  private initInput(inputContainer: HTMLElement): void {
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
    this.chatInput = textarea;

    this.sendButton = inputContainer.createEl('button', {
      cls: 'nb-send-button',
      text: 'Send',
    });
    this.sendButton.style.cssText = `
      padding: 0.5rem 1rem;
      background-color: var(--interactive-accent);
      color: var(--text-on-accent);
      border: none;
      border-radius: 0.375rem;
      cursor: pointer;
      font-weight: 500;
    `;

    this.sendButton.onclick = () => this.sendMessage();
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        this.sendMessage();
      }
    });
  }

  private async loadProviders() {
    try {
      this.providers = await this.client.getCapabilities();
    } catch (error) {
      console.error('[NoteBuddy] Failed to load providers:', error);
      this.providers = [];
    }
  }

  private populateModelSelect() {
    this.modelSelect.empty();
    const modelOptions = buildModelOptions(this.providers);

    for (const [value, text] of Object.entries(modelOptions)) {
      const option = this.modelSelect.createEl('option', { value, text });
      if (this.activeSession?.modelId === value) {
        option.selected = true;
      }
    }
  }

  private async onModelChange() {
    if (!this.activeSession) return;
    const newModelId = this.modelSelect.value;
    if (newModelId !== this.activeSession.modelId) {
      try {
        await this.plugin.changeModel(this.activeSession.id, newModelId);
        this.activeSession.modelId = newModelId;
      } catch (error) {
        console.error('[NoteBuddy] Failed to change model:', error);
        new Notice(`Failed to change model: ${(error as Error).message}`);
      }
    }
  }

  private async loadChatState() {
    const { pluginData } = this.plugin;
    const sessions = pluginData.sessions || [];
    const activeSessionId = pluginData.activeSessionId;

    const activeSession = sessions.find((s: ChatSession) => s.id === activeSessionId);
    this.activeSession = activeSession || sessions[0];

    if (!this.activeSession) {
      this.activeSession = {
        id: crypto.randomUUID(),
        name: 'Chat',
        modelId: pluginData.defaultModelId || '',
        messages: [],
        usage: { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0 },
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      sessions.push(this.activeSession);
      await this.plugin.savePluginData();
    }
  }

  private async switchSession(sessionId: string) {
    if (this.isStreaming && this.currentAbortController) {
      this.currentAbortController.abort();
      this.isStreaming = false;
      this.currentAbortController = null;
    }

    const { pluginData } = this.plugin;
    const session = pluginData.sessions.find((s: ChatSession) => s.id === sessionId);
    if (session) {
      this.activeSession = session;
      pluginData.activeSessionId = session.id;
      await this.plugin.savePluginData();
      this.populateModelSelect();
      this.renderMessages();
      this.renderSessionList();
    }
  }

  private async onNewSession() {
    const { pluginData } = this.plugin;
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      name: `Chat ${pluginData.sessions.length + 1}`,
      modelId: pluginData.defaultModelId || '',
      messages: [],
      usage: { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    pluginData.sessions.push(newSession);
    pluginData.activeSessionId = newSession.id;
    this.activeSession = newSession;
    await this.plugin.savePluginData();
    this.populateModelSelect();
    this.renderMessages();
    this.renderSessionList();
  }

  private async onDeleteSession() {
    if (!this.activeSession) return;

    const { pluginData } = this.plugin;
    const index = pluginData.sessions.findIndex((s: ChatSession) => s.id === this.activeSession!.id);
    if (index !== -1) {
      pluginData.sessions.splice(index, 1);
      this.activeSession = pluginData.sessions[0];
      pluginData.activeSessionId = this.activeSession?.id;
      await this.plugin.savePluginData();
      this.populateModelSelect();
      this.renderMessages();
      this.renderSessionList();
    }
  }

  private renderSessionList() {
    this.sessionListContainer.empty();
    const { sessions } = this.plugin.pluginData;

    sessions.forEach((session: ChatSession) => {
      const sessionEl = this.sessionListContainer.createDiv({ cls: 'nb-session-item' });
      const isActive = this.activeSession?.id === session.id;
      sessionEl.style.cssText = `
        padding: 0.5rem 1rem;
        cursor: pointer;
        display: flex;
        justify-content: space-between;
        align-items: center;
        ${isActive ? 'background-color: var(--background-modifier-active-hover);' : ''}
      `;
      sessionEl.createEl('span', { text: session.name });

      if (session.usage.totalTokens > 0) {
        const usage = sessionEl.createEl('span', {
          text: `${session.usage.totalTokens} tokens`,
          cls: 'nb-session-usage',
        });
        usage.style.cssText = `
          font-size: 0.75rem;
          color: var(--text-muted);
        `;
      }

      sessionEl.onclick = () => this.switchSession(session.id);
    });
  }

  private validateBeforeSend(message: string): { canSend: boolean; selectedModelId?: string } {
    if (!message) {
      new Notice('Please enter a message');
      return { canSend: false };
    }

    const tokenBudget = this.plugin.pluginData.tokenBudget || 100000;
    const estimatedTokens = Math.ceil(message.length / 4);
    if (estimatedTokens > tokenBudget) {
      new Notice(`Message exceeds token budget (${estimatedTokens} > ${tokenBudget})`);
      return { canSend: false };
    }

    return {
      canSend: true,
      selectedModelId: this.resolveSelectedModelId(),
    };
  }

  private setSendState(isSending: boolean): void {
    this.isStreaming = isSending;
    this.sendButton.disabled = isSending;
    this.sendButton.textContent = isSending ? 'Sending...' : 'Send';
  }

  private appendUserMessage(content: string): ChatMessage {
    const userMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'user',
      content,
      timestamp: Date.now(),
    };
    this.pushMessageToSession(userMessage);
    this.appendMessage(userMessage);
    return userMessage;
  }

  private appendAssistantPlaceholder(): ChatMessage {
    const assistantMessage: ChatMessage = {
      id: crypto.randomUUID(),
      role: 'assistant',
      content: '',
      timestamp: Date.now(),
    };
    this.pushMessageToSession(assistantMessage);
    this.appendMessage(assistantMessage);
    return assistantMessage;
  }

  private pushMessageToSession(message: ChatMessage): void {
    if (!this.activeSession) {
      return;
    }
    this.activeSession.messages.push(message);
    this.activeSession.messages = trimSessionMessages(this.activeSession.messages);
  }

  private removeMessage(messageId: string): void {
    if (!this.activeSession) {
      return;
    }

    this.activeSession.messages = this.activeSession.messages.filter((message) => message.id !== messageId);
    const messageEl = this.messageElements.get(messageId);
    if (messageEl) {
      messageEl.remove();
      this.messageElements.delete(messageId);
    }

    this.renderWelcomeMessageIfEmpty();
  }

  private async ensureSelectedModelAvailable(selectedModelId: string | undefined): Promise<boolean> {
    if (!selectedModelId) {
      return true;
    }

    const providers = await this.client.getCapabilities();
    if (!this.isModelAvailable(selectedModelId, providers)) {
      new Notice(`Selected model '${selectedModelId}' is not available`);
      return false;
    }

    return true;
  }

  private async sendMessage() {
    if (!this.chatInput || !this.activeSession || this.isStreaming) return;

    const message = this.chatInput.value.trim();
    const validation = this.validateBeforeSend(message);
    if (!validation.canSend) {
      return;
    }
    const selectedModelId = validation.selectedModelId;

    if (!(await this.ensureSelectedModelAvailable(selectedModelId))) {
      return;
    }

    this.setSendState(true);
    this.chatInput.value = '';
    this.currentAbortController = new AbortController();
    this.currentReply = '';

    this.appendUserMessage(message);
    const assistantMessage = this.appendAssistantPlaceholder();
    await this.plugin.savePluginData();

    try {
      const replyText = await this.client.sendMessageAndGetText(
        message,
        this.currentAbortController.signal,
        selectedModelId
      );

      this.currentReply = replyText;
      assistantMessage.content = replyText;
      this.updateMessageContent(assistantMessage.id, assistantMessage.content);

      this.finalizeAssistantMessage(assistantMessage, message);
      await this.plugin.savePluginData();
      this.renderSessionList();
    } catch (error) {
      const err = error as Error;
      if (err.name === 'AbortError') {
        if (!assistantMessage.content.trim()) {
          this.removeMessage(assistantMessage.id);
        } else {
          await this.plugin.savePluginData();
        }
      } else {
        console.error('[NoteBuddy] Send failed:', error);
        new Notice(`Failed to send message: ${err.message}`);
        this.removeMessage(assistantMessage.id);
        await this.plugin.savePluginData();
      }
    } finally {
      this.setSendState(false);
      this.currentAbortController = null;
    }
  }

  private finalizeAssistantMessage(assistantMessage: ChatMessage, userInput: string): void {
    if (!this.activeSession) {
      return;
    }

    assistantMessage.usage = {
      inputTokens: Math.ceil(userInput.length / 4),
      outputTokens: Math.ceil(this.currentReply.length / 4),
      totalTokens: Math.ceil((userInput.length + this.currentReply.length) / 4),
    };

    this.activeSession.usage.totalInputTokens += assistantMessage.usage.inputTokens || 0;
    this.activeSession.usage.totalOutputTokens += assistantMessage.usage.outputTokens || 0;
    this.activeSession.usage.totalTokens += assistantMessage.usage.totalTokens || 0;
    this.activeSession.updatedAt = Date.now();
    this.updateMessageUsage(assistantMessage.id, assistantMessage.usage);
  }

  private resolveSelectedModelId(): string | undefined {
    const selectedFromDropdown = this.modelSelect?.value?.trim();
    const selectedFromSession = this.activeSession?.modelId?.trim();
    const selectedFromDefault = this.plugin.pluginData.defaultModelId?.trim();

    const candidate = selectedFromDropdown || selectedFromSession || selectedFromDefault;
    if (!candidate) {
      return undefined;
    }

    // Legacy data can contain non-qualified values (e.g. "default"), treat these as server default.
    if (!candidate.includes('/')) {
      return undefined;
    }

    return candidate;
  }

  private isModelAvailable(modelId: string, providers: Provider[]): boolean {
    const [providerId, candidateModelId] = modelId.split('/');
    if (!providerId || !candidateModelId) {
      return false;
    }

    const provider = providers.find((p) => p.id === providerId);
    if (!provider) {
      return false;
    }

    return provider.models.some((m) => m.id === candidateModelId);
  }

  private renderMessages() {
    this.messagesContainer.empty();
    this.messageElements.clear();

    if (!this.activeSession || this.activeSession.messages.length === 0) {
      this.renderWelcomeMessageIfEmpty();
      return;
    }

    for (const message of this.activeSession.messages) {
      this.appendMessage(message);
    }

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private renderWelcomeMessageIfEmpty(): void {
    if (this.activeSession && this.activeSession.messages.length > 0) {
      return;
    }

    const existingWelcome = this.messagesContainer.querySelector('.nb-message-system');
    if (existingWelcome) {
      return;
    }

    const welcomeMessage = this.messagesContainer.createDiv({ cls: 'nb-message nb-message-system' });
    welcomeMessage.createSpan({ text: 'Welcome to NoteBuddy! Chat with your notes here.' });
    welcomeMessage.style.cssText = `
      padding: 0.75rem;
      background-color: var(--background-secondary);
      border-radius: 0.5rem;
      font-size: 0.9rem;
      color: var(--text-muted);
    `;
  }

  private appendMessage(message: ChatMessage): void {
    const welcome = this.messagesContainer.querySelector('.nb-message-system');
    if (welcome) {
      welcome.remove();
    }

    const messageEl = this.createMessageElement(message);
    this.messagesContainer.appendChild(messageEl);
    this.messageElements.set(message.id, messageEl);
    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private createMessageElement(message: ChatMessage): HTMLElement {
    const messageEl = this.messagesContainer.createDiv({ cls: `nb-message nb-message-${message.role}` });
    const isUser = message.role === 'user';
    messageEl.style.cssText = `
      padding: 0.75rem;
      background-color: ${isUser ? 'var(--background-modifier-accent)' : 'var(--background-secondary)'};
      border-radius: 0.5rem;
      font-size: 0.9rem;
      align-self: ${isUser ? 'flex-end' : 'flex-start'};
      max-width: 70%;
    `;

    const content = messageEl.createDiv({ cls: 'nb-message-content' });
    content.textContent = message.content;

    if (message.usage) {
      this.addUsageElement(messageEl, message.usage);
    }

    return messageEl;
  }

  private updateMessageContent(messageId: string, content: string): void {
    const messageEl = this.messageElements.get(messageId);
    if (!messageEl) {
      return;
    }

    const contentEl = messageEl.querySelector('.nb-message-content');
    if (contentEl) {
      contentEl.textContent = content;
    }

    this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
  }

  private updateMessageUsage(messageId: string, usage: ChatMessage['usage']): void {
    const messageEl = this.messageElements.get(messageId);
    if (!messageEl || !usage) {
      return;
    }

    const existingUsage = messageEl.querySelector('.nb-message-usage');
    if (existingUsage) {
      existingUsage.remove();
    }

    this.addUsageElement(messageEl, usage);
  }

  private addUsageElement(messageEl: HTMLElement, usage: NonNullable<ChatMessage['usage']>): void {
    const usageEl = messageEl.createDiv({ cls: 'nb-message-usage' });
    usageEl.textContent = `Tokens: ${usage.totalTokens ?? 'N/A'} (in: ${usage.inputTokens ?? 'N/A'}, out: ${usage.outputTokens ?? 'N/A'})`;
    usageEl.style.cssText = `
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.5rem;
      padding-top: 0.5rem;
      border-top: 1px solid var(--background-modifier-border);
    `;
  }
}
