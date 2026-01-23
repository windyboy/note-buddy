export interface NoteAssistantSettings {
	opencodeEndpoint: string;
	timeout: number;
	showConfidence: boolean;
}

export const DEFAULT_SETTINGS: NoteAssistantSettings = {
	opencodeEndpoint: 'http://localhost:8000',
	timeout: 30000,
	showConfidence: false
};
