export enum Role {
  User = "user",
  Assistant = "assistant",
  System = "system",
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  referencedNoteIds: string[]; // Paths to the notes cited
  timestamp: number;
}

export interface Session {
  id: string;
  title: string;
  messages: Message[];
  createdAt: number;
  updatedAt: number;
  metadata?: Record<string, any>;
}

export interface NoteMetadata {
  path: string;
  title: string;
  tags: string[];
  mtime: number; // For cache invalidation
}

export interface PluginSettings {
  serverUrl: string;
  apiKey: string;
  autoArchive: boolean;
  archiveThresholdDays: number;
  debugMode: boolean;
}

export const DEFAULT_SETTINGS: PluginSettings = {
  serverUrl: "http://localhost:8080",
  apiKey: "",
  autoArchive: true,
  archiveThresholdDays: 30,
  debugMode: false,
};

export interface QueryRequest {
  prompt: string;
  sessionID: string;
  context?: string[]; // Note contents or IDs
}

export interface QueryResponse {
  content: string;
  referencedNoteIds: string[];
  suggestions?: {
    tags?: string[];
    links?: string[];
  };
}
