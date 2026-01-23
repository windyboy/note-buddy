import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';

class LoadingWidget extends WidgetType {
	constructor(private operationName: string) {
		super();
	}

	toDOM() {
		const overlayEl = document.createElement('div');
		overlayEl.className = 'note-assistant-loading-overlay';
		overlayEl.innerHTML = `
			<div class="loading-spinner"></div>
			<div class="loading-text">Processing ${this.operationName}...</div>
		`;
		return overlayEl;
	}

	eq(other: LoadingWidget) {
		return this.operationName === other.operationName;
	}

	updateDOM() {
		return false;
	}
}

export function createLoadingOverlay(operationName: string) {
	return ViewPlugin.fromClass(
		class {
			overlay: Decoration;

			constructor() {
				this.overlay = Decoration.widget({
					widget: new LoadingWidget(operationName),
					side: 1
				});
			}

			update(update: ViewUpdate) {
				// Overlay stays visible during updates
			}
		},
		{
			decorations: (v) => Decoration.set([{ from: 0, to: 0, value: v.overlay }])
		}
	);
}
