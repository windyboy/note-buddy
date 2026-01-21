import ky from 'ky';
import { Session, Message, QueryResponse, PluginSettings, MessageType } from '../models/types';

export class OpenCodeClient {
	private settings: PluginSettings;
	private http: typeof ky;

	constructor(settings: PluginSettings) {
		this.settings = settings;
		this.http = ky.create({
			prefixUrl: settings.apiEndpoint,
			headers: {
				Authorization: `Bearer ${settings.apiKey}`,
				'Content-Type': 'application/json',
			},
		});
	}

	async createSession(): Promise<Session> {
		const response = await this.http.post('session').json<Session>();
		return response;
	}

	async getSession(sessionId: string): Promise<Session> {
		const response = await this.http.get(`session/${sessionId}`).json<Session>();
		return response;
	}

	async deleteSession(sessionId: string): Promise<void> {
		await this.http.delete(`session/${sessionId}`);
	}

	async sendMessage(
		sessionId: string,
		message: string,
		onChunk?: (chunk: string) => void,
	): Promise<Message> {
		const response = this.http.post(`session/${sessionId}/message`, {
			json: { query: message },
		});

		if (onChunk) {
			let fullResponse = '';
			const text = await response.text();
			for (let i = 0; i < text.length; i++) {
				const chunk = text[i];
				fullResponse += chunk;
				onChunk(chunk);
			}
			return {
				id: '',
				role: MessageType.Assistant,
				content: fullResponse,
				timestamp: Date.now(),
			};
		}

		const result = await response.json<QueryResponse>();
		return {
			id: result.id,
			role: MessageType.Assistant,
			content: result.response,
			timestamp: result.timestamp,
		};
	}

	async healthCheck(): Promise<boolean> {
		try {
			await this.http.get('global/health').json();
			return true;
		} catch {
			return false;
		}
	}

	updateSettings(settings: PluginSettings): void {
		this.settings = settings;
		this.http = ky.create({
			prefixUrl: settings.apiEndpoint,
			headers: {
				Authorization: `Bearer ${settings.apiKey}`,
				'Content-Type': 'application/json',
			},
		});
	}
}