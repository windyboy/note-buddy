export class LoadingBar {
  private container: HTMLElement;
  private progressEl: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = parent.createDiv({ cls: "opencode-loading-container" });
    this.container.createSpan({
      text: "Indexing vault: ",
      cls: "opencode-loading-text",
    });
    const barWrapper = this.container.createDiv({
      cls: "opencode-progress-wrapper",
    });
    this.progressEl = barWrapper.createDiv({ cls: "opencode-progress-bar" });
    this.hide();
  }

  update(indexed: number, total: number) {
    const percent = Math.round((indexed / total) * 100);
    this.progressEl.style.width = `${percent}%`;
    this.show();

    if (indexed === total) {
      setTimeout(() => this.hide(), 2000);
    }
  }

  show() {
    this.container.style.display = "flex";
  }

  hide() {
    this.container.style.display = "none";
  }
}
