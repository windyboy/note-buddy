import { EditorView, Decoration, ViewPlugin, ViewUpdate, WidgetType } from '@codemirror/view';

export interface BannerState {
	message: string;
	queueSize: number;
	onCancel?: () => void;
}

class BannerWidget extends WidgetType {
	constructor(
		private message: string,
		private queueSize: number,
		private onCancel?: () => void
	) {
		super();
	}

	toDOM() {
		const bannerEl = document.createElement('div');
		bannerEl.className = 'note-assistant-banner';
		
		const message = document.createElement('span');
		message.className = 'banner-message';
		message.textContent = this.message;
		bannerEl.appendChild(message);

		if (this.queueSize > 0) {
			const queueInfo = document.createElement('span');
			queueInfo.className = 'banner-queue';
			queueInfo.textContent = `${this.queueSize} operation${this.queueSize > 1 ? 's' : ''} ahead`;
			bannerEl.appendChild(queueInfo);
		}

		if (this.onCancel) {
			const cancelBtn = document.createElement('button');
			cancelBtn.textContent = 'Cancel';
			cancelBtn.className = 'banner-cancel';
			cancelBtn.onclick = () => this.onCancel?.();
			bannerEl.appendChild(cancelBtn);
		}

		return bannerEl;
	}

	eq(other: BannerWidget) {
		return this.message === other.message && this.queueSize === other.queueSize;
	}

	updateDOM(dom: HTMLElement) {
		const messageEl = dom.querySelector('.banner-message');
		if (messageEl) {
			messageEl.textContent = this.message;
		}
		return false;
	}
}

export function createBannerNotification(state: BannerState) {
	return ViewPlugin.fromClass(
		class {
			banner: Decoration;
			private state: BannerState;

			constructor(view: EditorView) {
				this.state = state;
				this.banner = this.createBanner();
			}

			private createBanner(): Decoration {
				return Decoration.widget({
					widget: new BannerWidget(this.state.message, this.state.queueSize, this.state.onCancel),
					side: -1
				});
			}

			update(update: ViewUpdate) {
				// Banner updates when state changes
			}
		},
		{
			decorations: (v) => Decoration.set([{ from: 0, to: 0, value: v.banner }])
		}
	);
}
