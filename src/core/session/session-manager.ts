import { Session, Message } from "../../models/types";
import { StateManager } from "./state-manager";

export class SessionManager {
  private stateManager: StateManager;
  private activeSession: Session | null = null;

  constructor(stateManager: StateManager) {
    this.stateManager = stateManager;
  }

  createSession(title: string): Session {
    const session: Session = {
      id: Date.now().toString(),
      title,
      messages: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    this.stateManager.saveSession(session);
    this.activeSession = session;
    return session;
  }

  setActiveSession(id: string): Session | undefined {
    const session = this.stateManager.getSession(id);
    if (session) {
      this.activeSession = session;
    }
    return session;
  }

  getActiveSession(): Session | null {
    return this.activeSession;
  }

  addMessage(message: Message): void {
    if (!this.activeSession) {
      this.createSession("New Chat");
    }

    if (this.activeSession) {
      this.activeSession.messages.push(message);
      this.activeSession.updatedAt = Date.now();
      this.stateManager.saveSession(this.activeSession);
    }
  }

  getHistory(): Message[] {
    return this.activeSession?.messages || [];
  }

  getSessions(): Session[] {
    return this.stateManager.getSessions();
  }

  deleteSession(id: string): void {
    this.stateManager.deleteSession(id);
    if (this.activeSession?.id === id) {
      this.activeSession = null;
    }
  }
}
