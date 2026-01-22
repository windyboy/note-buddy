import { App, TFile } from "obsidian";
import { NoteMetadata } from "../models/types";

export class VaultService {
  private app: App;

  constructor(app: App) {
    this.app = app;
  }

  async getMarkdownFiles(): Promise<TFile[]> {
    return this.app.vault.getMarkdownFiles();
  }

  async getNoteMetadata(file: TFile): Promise<NoteMetadata> {
    const cache = this.app.metadataCache.getFileCache(file);
    const tags = (cache?.tags || []).map((t) => t.tag);

    return {
      path: file.path,
      title: file.basename,
      tags,
      mtime: file.stat.mtime,
    };
  }

  async readNote(file: TFile): Promise<string> {
    return await this.app.vault.read(file);
  }

  async readNoteByPath(path: string): Promise<string | null> {
    const file = this.app.vault.getAbstractFileByPath(path);
    if (file instanceof TFile) {
      return await this.app.vault.read(file);
    }
    return null;
  }
}
