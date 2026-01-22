import { Session } from "../../models/types";

export class StateManager {
  private sessions: Map<string, Session> = new Map();

  async loadSessions(data: any): Promise<void> {
    if (data?.sessions) {
      // Re-hydrate the sessions map
      this.sessions = new Map();
      for (const [id, sessionData] of Object.entries(data.sessions)) {
        this.sessions.set(id, sessionData as Session);
      }
    }
  }

  getSessions(): Session[] {
    return Array.from(this.sessions.values()).sort(
      (a, b) => b.updatedAt - a.updatedAt,
    );
  }

  getSession(id: string): Session | undefined {
    return this.sessions.get(id);
  }

  saveSession(session: Session): void {
    session.updatedAt = Date.now();
    this.sessions.set(session.id, session);
  }

  deleteSession(id: string): void {
    this.sessions.delete(id);
  }

  serialize(): any {
    return {
      sessions: Object.fromEntries(this.sessions),
    };
  }
}
