import { ItemView, WorkspaceLeaf, setIcon, Notice } from "obsidian";
import { OpencodeService } from "../services/opencode-service";
import { StateManager } from "../core/session/state-manager";
import { SessionManager } from "../core/session/session-manager";
import { VaultIndexer } from "../core/indexing/indexer";
import { QueryEngine } from "../core/query/query-engine";
import { MessageList } from "./components/message-list";
import { LoadingBar } from "./components/loading-bar";
import { SessionList } from "./components/session-list";
import { SuggestionView } from "./components/suggestion-view";
import { TypingIndicator } from "./components/typing-indicator";
import { PluginSettings, Role } from "../models/types";

export const VIEW_TYPE_CHAT = "opencode-chat-view";

export class ChatView extends ItemView {
  private opencodeService: OpencodeService;
  private stateManager: StateManager;
  private sessionManager: SessionManager;
  private indexer: VaultIndexer;
  private queryEngine: QueryEngine;
  private settings: PluginSettings;

  private messageList: MessageList;
  private sessionList: SessionList;
  private loadingBar: LoadingBar;
  private suggestionView: SuggestionView;
  private typingIndicator: TypingIndicator;
  private textarea: HTMLTextAreaElement;
  private sendBtn: HTMLButtonElement;

  constructor(
    leaf: WorkspaceLeaf,
    opencodeService: OpencodeService,
    stateManager: StateManager,
    sessionManager: SessionManager,
    indexer: VaultIndexer,
    queryEngine: QueryEngine,
    settings: PluginSettings,
  ) {
    super(leaf);
    this.opencodeService = opencodeService;
    this.stateManager = stateManager;
    this.sessionManager = sessionManager;
    this.indexer = indexer;
    this.queryEngine = queryEngine;
    this.settings = settings;
  }

  getViewType(): string {
    return VIEW_TYPE_CHAT;
  }

  getDisplayText(): string {
    return "Opencode Chat";
  }

  async onOpen(): Promise<void> {
    const container = this.containerEl.children[1] as HTMLElement;
    container.empty();

    const mainWrapper = container.createDiv({ cls: "opencode-view-wrapper" });

    // Sidebar for sessions
    const sidebar = mainWrapper.createDiv({ cls: "opencode-sidebar" });
    this.sessionList = new SessionList(
      sidebar,
      this.sessionManager,
      (id) => this.handleSwitchSession(id),
      (id) => this.handleDeleteSession(id),
      () => this.handleCreateSession(),
    );

    // Main chat area
    const contentArea = mainWrapper.createDiv({ cls: "opencode-content-area" });
    const header = contentArea.createDiv({ cls: "opencode-header" });
    header.createEl("h4", { text: "Opencode Chat" });

    this.loadingBar = new LoadingBar(contentArea);
    this.suggestionView = new SuggestionView(contentArea);

    const chatEl = contentArea.createDiv({ cls: "opencode-chat-container" });
    const messagesContainer = chatEl.createDiv({ cls: "opencode-messages" });
    this.messageList = new MessageList(messagesContainer);
    this.typingIndicator = new TypingIndicator(messagesContainer);

    const inputArea = contentArea.createDiv({ cls: "opencode-input-area" });
    this.textarea = inputArea.createEl("textarea", {
      cls: "opencode-textarea",
      attr: { placeholder: "Ask anything about your vault..." },
    });

    this.sendBtn = inputArea.createEl("button", {
      cls: "opencode-send-btn",
    });
    setIcon(this.sendBtn, "send");

    this.sendBtn.onclick = () => this.handleSendMessage();
    this.textarea.onkeydown = (e) => {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        this.handleSendMessage();
      }
    };

    // Initial render
    this.render();
  }

  private handleSwitchSession(id: string) {
    this.sessionManager.setActiveSession(id);
    this.suggestionView.hide();
    this.render();
  }

  private handleDeleteSession(id: string) {
    this.sessionManager.deleteSession(id);
    this.render();
  }

  private handleCreateSession() {
    this.sessionManager.createSession("New Chat");
    this.suggestionView.hide();
    this.render();
  }

  private render() {
    this.sessionList.render();
    this.messageList.render(this.sessionManager.getHistory());
  }

  private async handleSendMessage() {
    const prompt = this.textarea.value.trim();
    if (!prompt) return;

    this.textarea.value = "";
    this.textarea.disabled = true;
    this.sendBtn.disabled = true;

    try {
      // US0 connectivity check
      const isHealthy = await this.opencodeService.checkHealth();
      if (!isHealthy) {
        new Notice("NoteBuddy: Cannot connect to server.");
        return;
      }

      // US2: Add user message to history
      const userMsg = {
        id: Date.now().toString(),
        role: Role.User,
        content: prompt,
        referencedNoteIds: [],
        timestamp: Date.now(),
      };
      this.sessionManager.addMessage(userMsg);
      this.messageList.addMessage(userMsg);

      this.typingIndicator.show();

      // US1: Prepare grounded query
      const queryRequest = await this.queryEngine.prepareQuery(
        prompt,
        this.sessionManager.getActiveSession()?.id || "default",
        this.sessionManager.getHistory().slice(0, -1), // Exclude current message
      );

      // US1: Send to server
      const response = await this.opencodeService.sendMessage(
        queryRequest.sessionID,
        queryRequest.prompt,
        queryRequest.context,
      );

      // US1: Add assistant message
      const assistantMsg = {
        id: (Date.now() + 1).toString(),
        role: Role.Assistant,
        content: response.content,
        referencedNoteIds: response.referencedNoteIds,
        timestamp: Date.now(),
      };
      this.sessionManager.addMessage(assistantMsg);
      this.messageList.addMessage(assistantMsg);

      // US3: Show suggestions (T029)
      this.suggestionView.render(response.suggestions);

      // Force re-render of session list
      this.sessionList.render();
    } catch (error) {
      new Notice("NoteBuddy: Failed to process query.");
      if (this.settings.debugMode) console.error(error);
    } finally {
      this.typingIndicator.hide();
      this.textarea.disabled = false;
      this.sendBtn.disabled = false;
      this.textarea.focus();
    }
  }

  async onClose(): Promise<void> {
    // Cleanup if needed
  }
}
