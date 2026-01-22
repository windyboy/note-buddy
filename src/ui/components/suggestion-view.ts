export class SuggestionView {
  private container: HTMLElement;

  constructor(parent: HTMLElement) {
    this.container = parent.createDiv({
      cls: "opencode-suggestions-container",
    });
    this.hide();
  }

  render(suggestions?: { tags?: string[]; links?: string[] }) {
    this.container.empty();
    if (!suggestions) {
      this.hide();
      return;
    }

    let hasContent = false;

    if (suggestions.tags && suggestions.tags.length > 0) {
      hasContent = true;
      const tagsEl = this.container.createDiv({
        cls: "opencode-suggestion-tags",
      });
      tagsEl.createSpan({
        text: "Suggested Tags: ",
        cls: "opencode-suggestion-label",
      });
      for (const tag of suggestions.tags) {
        tagsEl.createSpan({ text: tag, cls: "opencode-tag" });
      }
    }

    if (suggestions.links && suggestions.links.length > 0) {
      hasContent = true;
      const linksEl = this.container.createDiv({
        cls: "opencode-suggestion-links",
      });
      linksEl.createSpan({
        text: "Suggested Links: ",
        cls: "opencode-suggestion-label",
      });
      for (const link of suggestions.links) {
        linksEl.createSpan({ text: link, cls: "opencode-link" });
      }
    }

    if (hasContent) {
      this.show();
    } else {
      this.hide();
    }
  }

  show() {
    this.container.style.display = "block";
  }

  hide() {
    this.container.style.display = "none";
  }
}
