import { Modal, Setting, App } from 'obsidian';
import { Suggestion } from '../models/operation';

export class SuggestionModal extends Modal {
	suggestion: Suggestion;
	onAccept: (suggestion: Suggestion, editedContent?: string) => void;
	onReject: () => void;
	editedContent: string;

	constructor(
		app: App,
		suggestion: Suggestion,
		onAccept: (suggestion: Suggestion, editedContent?: string) => void,
		onReject: () => void
	) {
		super(app);
		this.suggestion = suggestion;
		this.onAccept = onAccept;
		this.onReject = onReject;
		this.editedContent = suggestion.content;
	}

	onOpen() {
		const { contentEl } = this;
		contentEl.empty();

		contentEl.createEl('h2', { text: 'AI Suggestion' });

		if (this.suggestion.explanation) {
			contentEl.createEl('p', { text: this.suggestion.explanation });
		}

		// Editable content area
		const contentSetting = new Setting(contentEl)
			.setName('Suggested Content')
			.setDesc('You can edit the suggestion before accepting');

		const textarea = contentSetting.controlEl.createEl('textarea', {
			attr: {
				style: 'width: 100%; min-height: 100px;',
				placeholder: 'Suggestion content...'
			}
		});
		textarea.value = this.editedContent;
		textarea.oninput = (e) => {
			this.editedContent = (e.target as HTMLTextAreaElement).value;
		};

		// Buttons
		new Setting(contentEl)
			.addButton(button => button
				.setButtonText('Accept')
				.setCta()
				.onClick(() => {
					const isEdited = this.editedContent !== this.suggestion.content;
					this.onAccept(this.suggestion, isEdited ? this.editedContent : undefined);
					this.close();
				}))
			.addButton(button => button
				.setButtonText('Reject')
				.onClick(() => {
					this.onReject();
					this.close();
				}));
	}

	onClose() {
		const { contentEl } = this;
		contentEl.empty();
	}
}
