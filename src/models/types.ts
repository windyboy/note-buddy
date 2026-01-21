export enum MessageType {
	User = 'user',
	Assistant = 'assistant',
	System = 'system',
}

export interface Message {
	id: string;
	role: MessageType;
	content: string;
	timestamp: number;
}

export interface Session {
	id: string;
	createdAt: number;
	updatedAt: number;
	messages: Message[];
	metadata?: Record<string, unknown>;
}

export interface Note {
	id: string;
	title: string;
	content: string;
	createdAt: number;
	updatedAt: number;
	sessionId?: string;
}

export interface Query {
	id: string;
	sessionId: string;
	query: string;
	context?: string;
	timestamp: number;
}

export interface QueryResponse {
	id: string;
	queryId: string;
	response: string;
	reasoning?: string;
	parts?: Part[];
	timestamp: number;
}

export interface Part {
	type: 'text' | 'reasoning' | 'file' | 'tool' | 'tool_result';
	content: string;
}

export interface PluginSettings {
	apiEndpoint: string;
	apiKey: string;
	debounceInterval: number;
	maxHistoryLength: number;
}