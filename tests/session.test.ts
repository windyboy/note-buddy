import { SessionManager } from '../src/models/session';
import { MessageType } from '../src/models/types';

describe('SessionManager', () => {
	let sessionManager: SessionManager;

	beforeEach(() => {
		sessionManager = new SessionManager();
	});

	afterEach(() => {
		localStorage.clear();
	});

	test('createSession should create a new session', () => {
		const session = sessionManager.createSession();
		expect(session.id).toBeDefined();
		expect(session.messages).toEqual([]);
		expect(session.createdAt).toBeLessThanOrEqual(Date.now());
	});

	test('getSession should return a session by ID', () => {
		const session = sessionManager.createSession();
		const retrieved = sessionManager.getSession(session.id);
		expect(retrieved).toEqual(session);
	});

	test('getSession should return null for non-existent session', () => {
		const retrieved = sessionManager.getSession('non-existent');
		expect(retrieved).toBeNull();
	});

	test('addMessage should add a message to a session', () => {
		const session = sessionManager.createSession();
		const message = sessionManager.addMessage(session.id, MessageType.User, 'Test message');
		expect(message).toBeDefined();
		expect(message?.content).toBe('Test message');

		const updatedSession = sessionManager.getSession(session.id);
		expect(updatedSession?.messages).toHaveLength(1);
	});

	test('deleteSession should remove a session', () => {
		const session = sessionManager.createSession();
		const deleted = sessionManager.deleteSession(session.id);
		expect(deleted).toBe(true);
		expect(sessionManager.getSession(session.id)).toBeNull();
	});
});