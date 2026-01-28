// Model discovery types
export interface ModelDescriptor {
    id: string;
    object: string;
    created: number;
    owned_by: string;
}

// Provider and model types for capabilities endpoint
export interface Provider {
    id: string;
    name: string;
    models: Model[];
}

export interface Model {
    id: string;
    name: string;
    description?: string;
}

export interface ModelSelection {
    providerId: string;
    modelId: string;
}

export interface CapabilitiesResponse {
    providers: Provider[];
}

// Service settings (persisted in Obsidian plugin data)
export interface ServiceSettings {
    serviceUrl: string;
    defaultModelId?: string;
}

// NoteBuddy settings extended with model selection
export interface NoteBuddySettings extends ServiceSettings {
    modelSelection?: ModelSelection;
}

export const defaultSettings: ServiceSettings = {
    serviceUrl: 'http://127.0.0.1:4096'
};

// Connection state (in-memory)
export enum ConnectionStatus {
    Unknown = 'unknown',
    Connected = 'connected',
    Disconnected = 'disconnected',
    Testing = 'testing'
}

export interface ConnectionState {
    status: ConnectionStatus;
    lastTestTime?: number;
    lastError?: string;
}

// Session state (in-memory)
export interface SessionState {
    sessionID: string;
    createTime: number;
    title?: string;
}

// Message types (ephemeral)
export interface MessagePart {
  text: string;
  role: 'user' | 'assistant';
  type: string;
}

export interface SendMessage {
    parts: MessagePart[];
    model?: {
        providerID: string;
        modelID: string;
    };
    agent?: string;
    system?: string;
}

export interface MessageInfo {
    messageID: string;
    sessionID: string;
    role: string;
    createTime: number;
    model?: {
        providerID: string;
        modelID: string;
    };
}

export interface MessageResponse {
    info: MessageInfo;
    parts: MessagePart[];
}

// Message state (in-memory)
export enum MessageStatus {
    Idle = 'idle',
    Sending = 'sending',
    Sent = 'sent',
    Error = 'error'
}

export interface MessageState {
    status: MessageStatus;
    error?: string;
    sendTime?: number;
}

// Cache TTL for models (5 minutes in milliseconds)
export const MODELS_CACHE_TTL = 5 * 60 * 1000;