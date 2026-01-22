import { VaultService } from "../../services/vault-service";
import { NoteMetadata } from "../../models/types";

export interface IndexingProgress {
  indexed: number;
  total: number;
}

export class VaultIndexer {
  private vaultService: VaultService;
  private index: Map<string, NoteMetadata> = new Map();
  private isIndexing: boolean = false;

  constructor(vaultService: VaultService) {
    this.vaultService = vaultService;
  }

  async startIndexing(
    onProgress?: (progress: IndexingProgress) => void,
  ): Promise<void> {
    if (this.isIndexing) return;
    this.isIndexing = true;

    const files = await this.vaultService.getMarkdownFiles();
    const total = files.length;
    let indexed = 0;

    for (const file of files) {
      // Use requestIdleCallback to keep UI responsive
      await this.yieldToMain();

      const metadata = await this.vaultService.getNoteMetadata(file);
      this.index.set(file.path, metadata);

      indexed++;
      onProgress?.({ indexed, total });
    }

    this.isIndexing = false;
  }

  private yieldToMain(): Promise<void> {
    return new Promise((resolve) => {
      if (window.requestIdleCallback) {
        window.requestIdleCallback(() => resolve());
      } else {
        setTimeout(resolve, 0);
      }
    });
  }

  getNoteMetadata(path: string): NoteMetadata | undefined {
    return this.index.get(path);
  }

  getAllMetadata(): NoteMetadata[] {
    return Array.from(this.index.values());
  }
}
