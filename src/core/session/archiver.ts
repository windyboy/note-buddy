import { StateManager } from "./state-manager";
import { PluginSettings } from "../../models/types";

export class SessionArchiver {
  private stateManager: StateManager;
  private settings: PluginSettings;

  constructor(stateManager: StateManager, settings: PluginSettings) {
    this.stateManager = stateManager;
    this.settings = settings;
  }

  archiveOldSessions(): void {
    if (!this.settings.autoArchive) return;

    const thresholdMs =
      this.settings.archiveThresholdDays * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const sessions = this.stateManager.getSessions();

    for (const session of sessions) {
      if (now - session.updatedAt > thresholdMs) {
        this.stateManager.deleteSession(session.id);
      }
    }
  }
}
