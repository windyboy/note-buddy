import { VaultService } from "../../services/vault-service";
import { VaultIndexer } from "../indexing/indexer";
import { QueryRequest, Message } from "../../models/types";

export class QueryEngine {
  private vaultService: VaultService;
  private indexer: VaultIndexer;

  constructor(vaultService: VaultService, indexer: VaultIndexer) {
    this.vaultService = vaultService;
    this.indexer = indexer;
  }

  async prepareQuery(
    prompt: string,
    sessionID: string,
    history: Message[],
  ): Promise<QueryRequest> {
    // Simple grounding: find notes referenced in prompt or history
    // In a more advanced version, we would use semantic search
    const relevantNotePaths = this.findRelevantNotes(prompt, history);
    const context: string[] = [];

    for (const path of relevantNotePaths) {
      const content = await this.vaultService.readNoteByPath(path);
      if (content) {
        context.push(`--- NOTE: ${path} ---\n${content}`);
      }
    }

    return {
      prompt,
      sessionID,
      context,
    };
  }

  private findRelevantNotes(prompt: string, history: Message[]): string[] {
    const query = (
      prompt +
      " " +
      history.map((m) => m.content).join(" ")
    ).toLowerCase();
    const allMetadata = this.indexer.getAllMetadata();

    // Return top 5 matches based on title/tags in the prompt
    return allMetadata
      .filter((meta) => {
        const titleMatch = query.includes(meta.title.toLowerCase());
        const tagMatch = meta.tags.some((tag) =>
          query.includes(tag.toLowerCase()),
        );
        return titleMatch || tagMatch;
      })
      .slice(0, 5)
      .map((meta) => meta.path);
  }
}
