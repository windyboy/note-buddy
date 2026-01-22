import { describe, it, expect, vi, beforeEach } from "vitest";
import { OpencodeService } from "../../src/services/opencode-service";
import { DEFAULT_SETTINGS } from "../../src/models/types";
import ky from "ky";

vi.mock("ky", () => ({
  default: {
    create: vi.fn(),
  },
}));

describe("OpencodeService", () => {
  let service: OpencodeService;

  beforeEach(() => {
    service = new OpencodeService(DEFAULT_SETTINGS);
    vi.clearAllMocks();
  });

  it("should return true when health check succeeds", async () => {
    const mockJson = vi.fn().mockResolvedValue({ status: "ok" });
    (ky.create as any).mockReturnValue({
      get: vi.fn().mockReturnValue({ json: mockJson }),
    });

    const result = await service.checkHealth();
    expect(result).toBe(true);
  });

  it("should return false when health check fails", async () => {
    (ky.create as any).mockReturnValue({
      get: vi.fn().mockReturnValue({
        json: vi.fn().mockRejectedValue(new Error("Network error")),
      }),
    });

    const result = await service.checkHealth();
    expect(result).toBe(false);
  });
});
