import { describe, it, expect, vi, beforeEach } from "vitest";

import * as obsidian from "obsidian";
import { OpenCodeClient } from "../../src/service";

function makeSessionResponse() {
  return {
    id: "ses_test",
    slug: "test",
    projectID: "proj",
    directory: "/tmp",
    title: "t",
    version: "0",
    time: { created: 123, updated: 124 },
  };
}

describe("OpenCodeClient (contract-compliant)", () => {
  const mockRequestUrl = vi.spyOn(obsidian, "requestUrl") as any;

  beforeEach(() => {
    mockRequestUrl.mockReset();
  });

  it("createSession maps Session.id and Session.time.created", async () => {
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    } as any);

    const client = new OpenCodeClient("http://127.0.0.1:4096");
    const session = await client.createSession();

    expect(session.sessionID).toBe("ses_test");
    expect(session.createTime).toBe(123);
  });

  it("sendMessage sends TextPartInput without role and extracts text parts", async () => {
    // createSession
    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: makeSessionResponse(),
      text: JSON.stringify(makeSessionResponse()),
    } as any);

    // send message
    const responseBody = {
      info: {
        id: "msg_assistant",
        sessionID: "ses_test",
        role: "assistant",
        time: { created: 200 },
        parentID: "msg_parent",
        modelID: "m",
        providerID: "p",
        mode: "chat",
        agent: "default",
        path: { cwd: "/", root: "/" },
        cost: 0,
        tokens: { input: 0, output: 0, reasoning: 0, cache: { read: 0, write: 0 } },
      },
      parts: [
        { id: "p1", sessionID: "ses_test", messageID: "msg_assistant", type: "text", text: "Hello" },
        { id: "p2", sessionID: "ses_test", messageID: "msg_assistant", type: "text", text: "World" },
      ],
    };

    mockRequestUrl.mockImplementationOnce((async (options: any) => {
      // Assert request payload shape
      const body = JSON.parse(options.body);
      expect(body.parts).toEqual([{ type: "text", text: "hi" }]);
      expect(body.parts[0].role).toBeUndefined();

      return {
        status: 200,
        json: responseBody,
        text: JSON.stringify(responseBody),
      } as any;
    }) as any);

    const client = new OpenCodeClient("http://127.0.0.1:4096");
    const text = await client.sendMessage("hi");
    expect(text).toBe("Hello\nWorld");
  });

  it("getCapabilities normalizes provider.models map and parses required default", async () => {
    const providersResponse = {
      providers: [
        {
          id: "openai",
          name: "OpenAI",
          source: "config",
          env: [],
          options: {},
          models: {
            "gpt-4o": { id: "gpt-4o", name: "GPT-4o" },
            "gpt-4.1": { id: "gpt-4.1", name: "GPT-4.1" },
          },
        },
      ],
      default: { chat: "openai/gpt-4o" },
    };

    mockRequestUrl.mockResolvedValueOnce({
      status: 200,
      json: providersResponse,
      text: JSON.stringify(providersResponse),
    } as any);

    const client = new OpenCodeClient("http://127.0.0.1:4096");
    const providers = await client.getCapabilities(true);

    expect(providers).toHaveLength(1);
    expect(providers[0].id).toBe("openai");
    expect(providers[0].models.map((m) => m.id).sort()).toEqual(["gpt-4.1", "gpt-4o"]);
  });
});

