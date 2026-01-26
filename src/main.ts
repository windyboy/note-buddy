import { Plugin, WorkspaceLeaf } from 'obsidian';
import { ChatView, VIEW_TYPE_CHAT } from './chat-view';

export default class NoteBuddyPlugin extends Plugin {
  private ribbonIconEl: HTMLElement | null = null;

  async onload() {
    console.log('Loading NoteBuddy plugin...');

    this.registerView(
      VIEW_TYPE_CHAT,
      (leaf) => new ChatView(leaf, this)
    );

    this.addRibbonIcon('bot', 'NoteBuddy', () => {
      this.activateView();
    });

    this.addCommand({
      id: 'open-chat-view',
      name: 'Open NoteBuddy Chat',
      callback: () => {
        this.activateView();
      },
    });

    this.app.workspace.onLayoutReady(() => {
      this.activateView();
    });
  }

  onunload() {
    console.log('Unloading NoteBuddy plugin...');
  }

  async activateView() {
    const { workspace } = this.app;

    let leaf: WorkspaceLeaf | null = null;
    const leaves = workspace.getLeavesOfType(VIEW_TYPE_CHAT);

    if (leaves.length > 0) {
      leaf = leaves[0];
    } else {
      leaf = workspace.getRightLeaf(false);
    }

    if (leaf) {
      await workspace.setActiveLeaf(leaf);
      await leaf.setViewState({ type: VIEW_TYPE_CHAT, active: true });
    }
  }
}
