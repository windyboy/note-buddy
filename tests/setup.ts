import { vi } from "vitest";

const mockModule = vi.mock as unknown as (
  path: string,
  factory: () => Promise<unknown>,
  options: { virtual: boolean }
) => void;

mockModule(
  "obsidian",
  async () => {
    const mod = await import("./mocks/obsidian");
    return mod;
  },
  { virtual: true }
);
