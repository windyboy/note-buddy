import { SessionManager } from "../../core/session/session-manager";
import { setIcon } from "obsidian";

export class SessionList {
  private container: HTMLElement;
  private sessionManager: SessionManager;
  private onSwitch: (id: string) => void;
  private onDelete: (id: string) => void;
  private onCreate: () => void;

  constructor(
    parent: HTMLElement,
    sessionManager: SessionManager,
    onSwitch: (id: string) => void,
    onDelete: (id: string) => void,
    onCreate: () => void,
  ) {
    this.container = parent.createDiv({ cls: "opencode-session-list" });
    this.sessionManager = sessionManager;
    this.onSwitch = onSwitch;
    this.onDelete = onDelete;
    this.onCreate = onCreate;
  }

  render() {
    this.container.empty();

    const header = this.container.createDiv({ cls: "opencode-session-header" });
    header.createSpan({ text: "Sessions", cls: "opencode-session-title" });

    const addBtn = header.createEl("button", {
      cls: "opencode-session-add-btn",
    });
    setIcon(addBtn, "plus");
    addBtn.onclick = () => this.onCreate();

    const sessions = this.sessionManager.getSessions();
    const listEl = this.container.createDiv({ cls: "opencode-session-items" });

    for (const session of sessions) {
      const activeId = this.sessionManager.getActiveSession()?.id;
      const itemEl = listEl.createDiv({
        cls: `opencode-session-item ${session.id === activeId ? "is-active" : ""}`,
      });

      const titleEl = itemEl.createDiv({
        cls: "opencode-session-item-title",
        text: session.title,
      });
      titleEl.onclick = () => this.onSwitch(session.id);

      const deleteBtn = itemEl.createDiv({
        cls: "opencode-session-item-delete",
      });
      setIcon(deleteBtn, "trash");
      deleteBtn.onclick = (e) => {
        e.stopPropagation();
        this.onDelete(session.id);
      };
    }
  }
}
