import { Plugin, WorkspaceLeaf, Notice } from 'obsidian';
import './styles.css';
import { ChatView, VIEW_TYPE_CHAT } from './chat-view';
import { PluginData, asPluginData, ChatSession, ChatMessage, trimSessionMessages } from './models';
import { NoteBuddySettingTab } from './settings';

export default class NoteBuddyPlugin extends Plugin {
  private ribbonIconEl: HTMLElement | null = null;
  pluginData!: PluginData;

  async onload() {
    console.log('Loading NoteBuddy plugin...');

    await this.loadPluginData();

    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => new ChatView(leaf, this)
    );

    this.addRibbonIcon('bot', 'NoteBuddy', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-chat-view',
      name: 'Open NoteBuddy Chat',
      callback: () => {
        this.activateView();
      },
    });

    this.app.workspace.onLayoutReady(() => {
      this.activateView();
    });

    this.addSettingTab(new NoteBuddySettingTab(this.app, this));
  }

  onunload() {
    console.log('Unloading NoteBuddy plugin...');
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
    }

    if (leaf) {
      await workspace.setActiveLeaf(leaf);
      await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
    }
  }

  async loadPluginData() {
    const data = await this.loadData();
    this.pluginData = asPluginData(data);
  }

  async savePluginData() {
    await this.saveData(this.pluginData);
  }

  onModelUnavailable() {
    if (!this.pluginData.defaultModelId) {
      return;
    }

    const unavailableModel = this.pluginData.defaultModelId;
    this.pluginData.defaultModelId = undefined;
    void this.savePluginData();
    new Notice(`Model '${unavailableModel}' is unavailable. Switched to server default.`);
  }

  getActiveSession(): ChatSession | undefined {
    if (!this.pluginData.activeSessionId) return undefined;
    return this.pluginData.sessions.find(s => s.id === this.pluginData.activeSessionId);
  }

  async createSession(name: string, modelId: string): Promise<ChatSession> {
    const newSession: ChatSession = {
      id: crypto.randomUUID(),
      name,
      modelId,
      messages: [],
      usage: { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };

    this.pluginData.sessions.push(newSession);
    await this.setActiveSession(newSession.id);
    return newSession;
  }

  async setActiveSession(sessionId: string): Promise<void> {
    const session = this.pluginData.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }
    this.pluginData.activeSessionId = sessionId;
    await this.savePluginData();
  }

  async updateSession(sessionId: string, updates: Partial<ChatSession>): Promise<void> {
    const session = this.pluginData.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    Object.assign(session, updates, { updatedAt: Date.now() });
    await this.savePluginData();
  }

  async deleteSession(sessionId: string): Promise<void> {
    const index = this.pluginData.sessions.findIndex(s => s.id === sessionId);
    if (index === -1) {
      throw new Error(`Session ${sessionId} not found`);
    }

    this.pluginData.sessions.splice(index, 1);

    if (this.pluginData.activeSessionId === sessionId) {
      this.pluginData.activeSessionId = undefined;
    }

    await this.savePluginData();
  }

  async renameSession(sessionId: string, newName: string): Promise<void> {
    const session = this.pluginData.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.name = newName;
    await this.savePluginData();
  }

  async changeModel(sessionId: string, modelId: string): Promise<void> {
    const session = this.pluginData.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.modelId = modelId;
    session.updatedAt = Date.now();
    await this.savePluginData();
  }

  async addMessage(sessionId: string, message: ChatMessage): Promise<void> {
    const session = this.pluginData.sessions.find(s => s.id === sessionId);
    if (!session) {
      throw new Error(`Session ${sessionId} not found`);
    }

    session.messages.push(message);
    session.messages = trimSessionMessages(session.messages);
    session.updatedAt = Date.now();

    if (message.usage) {
      session.usage.totalInputTokens += message.usage.inputTokens || 0;
      session.usage.totalOutputTokens += message.usage.outputTokens || 0;
      session.usage.totalTokens += message.usage.totalTokens || 0;
    }

    await this.savePluginData();
  }
}
