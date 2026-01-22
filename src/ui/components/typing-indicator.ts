export class TypingIndicator {
  private el: HTMLElement;

  constructor(parent: HTMLElement) {
    this.el = parent.createDiv({ cls: "opencode-typing-indicator" });
    this.el.createDiv({ cls: "opencode-typing-dot" });
    this.el.createDiv({ cls: "opencode-typing-dot" });
    this.el.createDiv({ cls: "opencode-typing-dot" });
    this.hide();
  }

  show() {
    this.el.style.display = "flex";
  }

  hide() {
    this.el.style.display = "none";
  }
}
