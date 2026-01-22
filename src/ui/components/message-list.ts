import { Message } from "../../models/types";
import { Sanitizer } from "../../utils/sanitizer";

export class MessageList {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = parent;
  }

  render(messages: Message[]) {
    this.container.empty();
    for (const msg of messages) {
      this.addMessage(msg);
    }
  }

  addMessage(msg: Message) {
    const msgEl = this.container.createDiv({
      cls: `opencode-message opencode-message-${msg.role}`,
    });

    const contentEl = msgEl.createDiv({ cls: "opencode-message-content" });
    contentEl.innerHTML = Sanitizer.sanitize(msg.content);

    if (msg.referencedNoteIds && msg.referencedNoteIds.length > 0) {
      const citationsEl = msgEl.createDiv({ cls: "opencode-citations" });
      citationsEl.createSpan({
        text: "References: ",
        cls: "opencode-citation-label",
      });

      for (const path of msg.referencedNoteIds) {
        const link = citationsEl.createEl("a", {
          cls: "opencode-citation-link",
          text: path.split("/").pop() || path,
          attr: { href: "#" },
        });
        link.onclick = (e) => {
          e.preventDefault();
          // Dispatch event to open the note
          const event = new CustomEvent("opencode-open-note", {
            detail: { path },
          });
          window.dispatchEvent(event);
        };
      }
    }

    this.container.scrollTo(0, this.container.scrollHeight);
  }
}
