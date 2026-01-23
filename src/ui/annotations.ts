import { WidgetType } from '@codemirror/view';
import { Suggestion, Position } from '../models/operation';
import { DecisionAction } from '../models/preview';

export interface AnnotationCallbacks {
	onAccept: (suggestionId: string) => void;
	onReject: (suggestionId: string) => void;
	onEdit: (suggestionId: string) => void;
	onNext?: () => void;
	onPrev?: () => void;
}

export class AnnotationWidget extends WidgetType {
	constructor(
		private suggestion: Suggestion,
		private callbacks: AnnotationCallbacks,
		private currentIndex?: number,
		private totalCount?: number
	) {
		super();
	}

	toDOM(): HTMLElement {
		const container = document.createElement('div');
		container.className = 'note-assistant-annotation';
		
		const content = document.createElement('div');
		content.className = 'annotation-content';
		content.textContent = this.suggestion.content;
		container.appendChild(content);

		if (this.suggestion.explanation) {
			const explanation = document.createElement('div');
			explanation.className = 'annotation-explanation';
			explanation.textContent = this.suggestion.explanation;
			container.appendChild(explanation);
		}

		const actions = document.createElement('div');
		actions.className = 'annotation-actions';

		// Navigation buttons (if multiple suggestions)
		if (this.totalCount && this.totalCount > 1) {
			const nav = document.createElement('div');
			nav.className = 'annotation-nav';
			
			if (this.callbacks.onPrev) {
				const prevBtn = document.createElement('button');
				prevBtn.textContent = '← Prev';
				prevBtn.className = 'nav-btn';
				prevBtn.onclick = () => this.callbacks.onPrev?.();
				nav.appendChild(prevBtn);
			}

			const progress = document.createElement('span');
			progress.className = 'annotation-progress';
			progress.textContent = `${(this.currentIndex || 0) + 1} of ${this.totalCount}`;
			nav.appendChild(progress);

			if (this.callbacks.onNext) {
				const nextBtn = document.createElement('button');
				nextBtn.textContent = 'Next →';
				nextBtn.className = 'nav-btn';
				nextBtn.onclick = () => this.callbacks.onNext?.();
				nav.appendChild(nextBtn);
			}

			actions.appendChild(nav);
		}

		// Action buttons
		const acceptBtn = document.createElement('button');
		acceptBtn.textContent = 'Accept';
		acceptBtn.className = 'accept-btn';
		acceptBtn.onclick = () => this.callbacks.onAccept(this.suggestion.id);
		actions.appendChild(acceptBtn);

		const rejectBtn = document.createElement('button');
		rejectBtn.textContent = 'Reject';
		rejectBtn.className = 'reject-btn';
		rejectBtn.onclick = () => this.callbacks.onReject(this.suggestion.id);
		actions.appendChild(rejectBtn);

		const editBtn = document.createElement('button');
		editBtn.textContent = 'Edit';
		editBtn.className = 'edit-btn';
		editBtn.onclick = () => this.callbacks.onEdit(this.suggestion.id);
		actions.appendChild(editBtn);

		container.appendChild(actions);
		return container;
	}

	ignoreEvent(): boolean {
		return false;
	}
}
