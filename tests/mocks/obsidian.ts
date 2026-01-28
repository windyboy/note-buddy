// Minimal runtime stubs for the Obsidian API used in tests.
// In production builds, `obsidian` is treated as external.

export type RequestUrlParam = {
  url: string;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

export async function requestUrl(_options: RequestUrlParam): Promise<any> {
  throw new Error("requestUrl must be mocked in tests");
}

export class Notice {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(_message: string) {}
}

export class ItemView {}
export class WorkspaceLeaf {}

