import { Session, Message, MessageType } from './types';
import { v4 as uuid4 } from 'uuid';

export class SessionManager {
	private sessions: Map<string, Session> = new Map();

	constructor() {
		this.loadSessionsFromStorage();
	}

	private loadSessionsFromStorage(): void {
		const saved = localStorage.getItem('notebuddy-sessions');
		if (saved) {
			try {
				const parsed = JSON.parse(saved);
				Object.entries(parsed).forEach(([id, session]) => {
					this.sessions.set(id, session as Session);
				});
			} catch (error) {
				console.error('Failed to load sessions:', error);
			}
		}
	}

	private saveSessionsToStorage(): void {
		const serialized = Object.fromEntries(this.sessions);
		localStorage.setItem('notebuddy-sessions', JSON.stringify(serialized));
	}

	createSession(metadata?: Record<string, unknown>): Session {
		const session: Session = {
			id: uuid4(),
			createdAt: Date.now(),
			updatedAt: Date.now(),
			messages: [],
			metadata,
		};
		this.sessions.set(session.id, session);
		this.saveSessionsToStorage();
		return session;
	}

	getSession(sessionId: string): Session | null {
		return this.sessions.get(sessionId) ?? null;
	}

	updateSession(sessionId: string, metadata: Record<string, unknown>): Session | null {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		session.updatedAt = Date.now();
		session.metadata = { ...session.metadata, ...metadata };
		this.saveSessionsToStorage();
		return session;
	}

	addMessage(sessionId: string, role: MessageType, content: string): Message | null {
		const session = this.sessions.get(sessionId);
		if (!session) return null;

		const message: Message = {
			id: uuid4(),
			role,
			content,
			timestamp: Date.now(),
		};

		session.messages.push(message);
		session.updatedAt = Date.now();
		this.saveSessionsToStorage();
		return message;
	}

	deleteSession(sessionId: string): boolean {
		const deleted = this.sessions.delete(sessionId);
		if (deleted) {
			this.saveSessionsToStorage();
		}
		return deleted;
	}

	getAllSessions(): Session[] {
		return Array.from(this.sessions.values());
	}
}