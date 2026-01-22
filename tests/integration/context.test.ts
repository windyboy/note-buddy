import { describe, it, expect, beforeEach } from "vitest";
import { SessionManager } from "../../src/core/session/session-manager";
import { StateManager } from "../../src/core/session/state-manager";
import { Role } from "../../src/models/types";

describe("SessionManager Integration", () => {
  let stateManager: StateManager;
  let sessionManager: SessionManager;

  beforeEach(() => {
    stateManager = new StateManager();
    sessionManager = new SessionManager(stateManager);
  });

  it("should maintain conversation context across turns", () => {
    sessionManager.createSession("Test Session");

    sessionManager.addMessage({
      id: "1",
      role: Role.User,
      content: "Hello",
      referencedNoteIds: [],
      timestamp: Date.now(),
    });

    sessionManager.addMessage({
      id: "2",
      role: Role.Assistant,
      content: "Hi there!",
      referencedNoteIds: [],
      timestamp: Date.now(),
    });

    const history = sessionManager.getHistory();
    expect(history).toHaveLength(2);
    expect(history[0].content).toBe("Hello");
    expect(history[1].content).toBe("Hi there!");
  });

  it("should persist sessions through StateManager", () => {
    const session = sessionManager.createSession("Persistent Session");
    sessionManager.addMessage({
      id: "1",
      role: Role.User,
      content: "Save me",
      referencedNoteIds: [],
      timestamp: Date.now(),
    });

    const serialized = stateManager.serialize();
    expect(serialized.sessions[session.id]).toBeDefined();
    expect(serialized.sessions[session.id].messages).toHaveLength(1);
  });
});
