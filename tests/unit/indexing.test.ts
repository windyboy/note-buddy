import { describe, it, expect, vi, beforeEach } from "vitest";
import { VaultIndexer } from "../../src/core/indexing/indexer";
import { VaultService } from "../../src/services/vault-service";

describe("VaultIndexer", () => {
  let indexer: VaultIndexer;
  let mockVaultService: any;

  beforeEach(() => {
    mockVaultService = {
      getMarkdownFiles: vi.fn().mockResolvedValue([
        { path: "note1.md", basename: "note1", stat: { mtime: 100 } },
        { path: "note2.md", basename: "note2", stat: { mtime: 200 } },
      ]),
      getNoteMetadata: vi.fn().mockImplementation(async (file) => ({
        path: file.path,
        title: file.basename,
        tags: ["test"],
        mtime: file.stat.mtime,
      })),
    };
    indexer = new VaultIndexer(mockVaultService);
    vi.stubGlobal("requestIdleCallback", (cb: any) => cb());
  });

  it("should index all files and report progress", async () => {
    const progressSpy = vi.fn();
    await indexer.startIndexing(progressSpy);

    expect(indexer.getAllMetadata()).toHaveLength(2);
    expect(progressSpy).toHaveBeenCalledTimes(2);
    expect(progressSpy).toHaveBeenLastCalledWith({ indexed: 2, total: 2 });
  });

  it("should retrieve metadata by path", async () => {
    await indexer.startIndexing();
    const meta = indexer.getNoteMetadata("note1.md");
    expect(meta?.title).toBe("note1");
  });
});
