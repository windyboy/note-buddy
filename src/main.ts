import { Plugin, WorkspaceLeaf } from "obsidian";
import { PluginSettings, DEFAULT_SETTINGS } from "./models/types";
import { OpencodeService } from "./services/opencode-service";
import { StateManager } from "./core/session/state-manager";
import { SessionManager } from "./core/session/session-manager";
import { SessionArchiver } from "./core/session/archiver";
import { VaultService } from "./services/vault-service";
import { VaultIndexer } from "./core/indexing/indexer";
import { QueryEngine } from "./core/query/query-engine";
import { ChatView, VIEW_TYPE_CHAT } from "./ui/chat-view";
import { NoteBuddySettingTab } from "./settings/settings-tab";

export default class NoteBuddyPlugin extends Plugin {
  settings: PluginSettings;
  opencodeService: OpencodeService;
  stateManager: StateManager;
  sessionManager: SessionManager;
  archiver: SessionArchiver;
  vaultService: VaultService;
  indexer: VaultIndexer;
  queryEngine: QueryEngine;

  async onload() {
    await this.loadSettings();

    this.opencodeService = new OpencodeService(this.settings);
    this.stateManager = new StateManager();
    this.sessionManager = new SessionManager(this.stateManager);
    this.archiver = new SessionArchiver(this.stateManager, this.settings);
    this.vaultService = new VaultService(this.app);
    this.indexer = new VaultIndexer(this.vaultService);
    this.queryEngine = new QueryEngine(this.vaultService, this.indexer);

    // Load persisted sessions
    const data = await this.loadData();
    await this.stateManager.loadSessions(data);

    // Archive old sessions on startup
    this.archiver.archiveOldSessions();

    // Start background indexing
    this.indexer.startIndexing();

    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) =>
        new ChatView(
          leaf,
          this.opencodeService,
          this.stateManager,
          this.sessionManager,
          this.indexer,
          this.queryEngine,
          this.settings,
        ),
    );

    this.addRibbonIcon("message-square", "Open NoteBuddy Chat", () => {
      this.activateView();
    });

    this.addSettingTab(
      new NoteBuddySettingTab(this.app, this, this.opencodeService),
    );
  }

  async onunload() {
    // Cleanup if needed
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      const rightLeaf = workspace.getRightLeaf(false);
      if (rightLeaf) {
        leaf = rightLeaf;
        await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
      }
    }

    if (leaf) {
      workspace.revealLeaf(leaf);
    }
  }

  async loadSettings() {
    this.settings = Object.assign({}, DEFAULT_SETTINGS, await this.loadData());
  }

  async saveSettings() {
    const sessionData = this.stateManager.serialize();
    await this.saveData({ ...this.settings, ...sessionData });
  }
}
