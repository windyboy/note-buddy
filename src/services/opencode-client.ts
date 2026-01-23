import { NoteAssistantSettings } from '../models/settings';

export interface HealthResponse {
	healthy: boolean;
	version: string;
}

export interface SessionResponse {
	id: string;
	directory: string;
	time: {
		created: number;
		updated: number;
	};
}

export interface MessagePart {
	id?: string;
	sessionID?: string;
	messageID?: string;
	type: 'text' | 'reasoning' | 'file' | 'tool' | 'tool_result';
	text?: string;
}

export interface MessageResponse {
	info: {
		id: string;
		sessionID: string;
		role: string;
		time: {
			created: number;
		};
	};
	parts: MessagePart[];
}

export class OpenCodeClient {
	constructor(private endpoint: string) {}

	async healthCheck(): Promise<HealthResponse> {
		const response = await fetch(`${this.endpoint}/global/health`);
		if (!response.ok) {
			throw new Error(`Health check failed: ${response.statusText}`);
		}
		return await response.json();
	}

	async createSession(): Promise<string> {
		const response = await fetch(`${this.endpoint}/session`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				title: 'Note Assistant',
				permission: {
					read: { '*': 'deny' },
					edit: { '*': 'deny' },
					bash: { '*': 'deny' }
				}
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to create session: ${response.statusText}`);
		}

		const session: SessionResponse = await response.json();
		return session.id;
	}

	async sendMessage(sessionId: string, prompt: string): Promise<string> {
		const response = await fetch(`${this.endpoint}/session/${sessionId}/message`, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json'
			},
			body: JSON.stringify({
				parts: [
					{
						type: 'text',
						text: prompt
					}
				]
			})
		});

		if (!response.ok) {
			throw new Error(`Failed to send message: ${response.statusText}`);
		}

		const result: MessageResponse = await response.json();
		
		// Extract text from parts
		const textParts = result.parts
			.filter(p => p.type === 'text' && p.text)
			.map(p => p.text || '');
		
		return textParts.join('\n');
	}

	async deleteSession(sessionId: string): Promise<void> {
		const response = await fetch(`${this.endpoint}/session/${sessionId}`, {
			method: 'DELETE'
		});

		if (!response.ok) {
			throw new Error(`Failed to delete session: ${response.statusText}`);
		}
	}
}
