import { ItemView, WorkspaceLeaf } from "obsidian";

export const VIEW_TYPE_NOTE_BUDDY_CHAT = "note-buddy-chat";

export default class ChatView extends ItemView {
	messageContainer!: HTMLElement;
	textarea!: HTMLTextAreaElement;

	constructor(leaf: WorkspaceLeaf) {
		super(leaf);
	}

	getViewType() {
		return VIEW_TYPE_NOTE_BUDDY_CHAT;
	}

	getDisplayText() {
		return "Note Buddy";
	}

	private handleSend() {
		const message = this.textarea.value.trim();
		if (message) {
			const msgEl = this.messageContainer.createDiv("message");
			msgEl.style.marginBottom = "10px";
			msgEl.style.padding = "8px";
			msgEl.style.backgroundColor = "var(--background-secondary)";
			msgEl.style.borderRadius = "var(--radius-sm)";
			msgEl.textContent = message;

			this.textarea.value = "";
			this.messageContainer.scrollTop = this.messageContainer.scrollHeight;
		}
	}

	async onOpen() {
		this.containerEl.empty();
		this.containerEl.addClass("note-buddy-chat");

		this.containerEl.createEl("h2", { text: "Note Buddy" });

		this.messageContainer = this.containerEl.createDiv("message-container");
		this.messageContainer.style.overflowY = "auto";
		this.messageContainer.style.flex = "1";

		const inputBar = this.containerEl.createDiv("input-bar");
		inputBar.style.display = "flex";
		inputBar.style.flexDirection = "column";
		inputBar.style.marginTop = "10px";

		this.textarea = inputBar.createEl("textarea");
		this.textarea.placeholder = "Type a message...";
		this.textarea.style.flex = "1";
		this.textarea.style.minHeight = "40px";
		this.textarea.style.maxHeight = "200px";
		this.textarea.style.padding = "10px";
		this.textarea.style.resize = "vertical";

		const sendButton = inputBar.createEl("button", { text: "Send" });
		sendButton.style.marginTop = "8px";
		sendButton.style.padding = "8px 16px";
		sendButton.style.cursor = "pointer";

		sendButton.addEventListener("click", () => {
			this.handleSend();
		});

		this.textarea.addEventListener("keydown", (evt: KeyboardEvent) => {
			if (evt.key === "Enter" && !evt.shiftKey) {
				evt.preventDefault();
				this.handleSend();
			}
		});
	}

	async onClose() {
		console.log("ChatView closed");
	}
}
