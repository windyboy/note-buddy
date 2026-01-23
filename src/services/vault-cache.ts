import { TFile, Vault } from 'obsidian';

export interface VaultNote {
	path: string;
	basename: string;
}

export class VaultCache {
	private notes: Map<string, VaultNote> = new Map();

	constructor(private vault: Vault) {
		this.refresh();
	}

	refresh(): void {
		this.notes.clear();
		const files = this.vault.getMarkdownFiles();
		for (const file of files) {
			this.notes.set(file.path, {
				path: file.path,
				basename: file.basename
			});
		}
	}

	add(file: TFile): void {
		if (file.extension === 'md') {
			this.notes.set(file.path, {
				path: file.path,
				basename: file.basename
			});
		}
	}

	remove(path: string): void {
		this.notes.delete(path);
	}

	update(oldPath: string, file: TFile): void {
		this.remove(oldPath);
		this.add(file);
	}

	getAllNotes(): VaultNote[] {
		return Array.from(this.notes.values());
	}

	getNoteList(): string {
		return this.getAllNotes()
			.map(note => note.basename)
			.join('\n');
	}
}
