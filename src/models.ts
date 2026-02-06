/**
 * OpenCode API types.
 *
 * Source of truth: `specs/003-opencode-provider-config/contracts/opencode-api.json` (OpenAPI 3.1.1).
 *
 * Notes:
 * - The plugin keeps some UI-friendly shapes (e.g. Provider.models as array) derived from the contract.
 * - Request parts (inputs) are different from response parts (Part union).
 */

// --- Model/provider configuration (GET /config/providers) ---

export interface OpenCodeModel {
  id: string;
  name: string;
}

export interface OpenCodeProvider {
  id: string;
  name: string;
  source: 'env' | 'config' | 'custom' | 'api';
  env: string[];
  options: Record<string, unknown>;
  models: Record<string, OpenCodeModel>;
  // optional in schema
  key?: string;
}

export interface OpenCodeConfigProvidersResponse {
  providers: OpenCodeProvider[];
  /**
   * Contract: object with string keys -> string values.
   * Used by server to describe defaults (exact semantics are server-defined).
   */
  default: Record<string, string>;
}

// UI-friendly normalized provider list used by settings dropdown.
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

// Service settings (persisted in Obsidian plugin data)
export interface ServiceSettings {
    serviceUrl: string;
    defaultModelId?: string;
    tokenBudget?: number; // User-configurable token budget (in tokens)
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

// --- Sessions (POST /session returns Session) ---

export interface OpenCodeSession {
  id: string;
  slug: string;
  projectID: string;
  directory: string;
  title: string;
  version: string;
  time: { created: number; updated: number; compacting?: number; archived?: number };
  parentID?: string;
  share?: { url: string };
  summary?: { additions: number; deletions: number; files: number };
}

// --- Messaging (POST /session/{sessionID}/message) ---

export interface OpenCodeModelRef {
  providerID: string;
  modelID: string;
}

export type OpenCodePartInput =
  | TextPartInput
  | FilePartInput
  | AgentPartInput
  | SubtaskPartInput;

export interface TextPartInput {
  type: 'text';
  text: string;
  id?: string;
  synthetic?: boolean;
  ignored?: boolean;
  time?: { start: number; end?: number };
  metadata?: Record<string, unknown>;
}

export interface FilePartInput {
  type: 'file';
  url: string;
  mime?: string;
  filename?: string;
  id?: string;
}

export interface AgentPartInput {
  type: 'agent';
  name: string;
  id?: string;
}

export interface SubtaskPartInput {
  type: 'subtask';
  prompt: string;
  description: string;
  agent?: string;
  model?: OpenCodeModelRef;
  command?: string;
  id?: string;
}

export interface SendMessage {
  parts: OpenCodePartInput[];
  model?: OpenCodeModelRef;
  agent?: string;
  noReply?: boolean;
  /**
   * @deprecated per contract (tools+permissions merged on session), but still allowed by schema.
   */
  tools?: Record<string, boolean>;
  system?: string;
  variant?: string;
  messageID?: string;
}

// Contract errors used by endpoints we call.
export interface BadRequestError {
  success: boolean;
  data: unknown;
  errors?: unknown;
}

export interface NotFoundError {
  name: string;
  data: unknown;
}

export type OpenCodeError = unknown;

export interface AssistantMessage {
  id: string;
  sessionID: string;
  role: 'assistant';
  time: { created: number; completed?: number };
  parentID: string;
  modelID: string;
  providerID: string;
  mode: string;
  agent: string;
  path: { cwd: string; root: string };
  cost: number;
  tokens: {
    input: number;
    output: number;
    reasoning: number;
    cache: { read: number; write: number };
  };
  error?: OpenCodeError;
  summary?: boolean;
  finish?: string;
}

export type OpenCodePart =
  | TextPart
  | ReasoningPart
  | FilePart
  | ToolPart
  | StepStartPart
  | StepFinishPart
  | SnapshotPart
  | PatchPart
  | AgentPart
  | RetryPart
  | CompactionPart
  | UnknownPart;

export type OpenCodePartType =
  | 'text'
  | 'reasoning'
  | 'file'
  | 'tool'
  | 'step_start'
  | 'step_finish'
  | 'snapshot'
  | 'patch'
  | 'agent'
  | 'retry'
  | 'compaction'
  | 'unknown';

export interface BasePart {
  id: string;
  sessionID: string;
  messageID: string;
  type: OpenCodePartType;
}

export interface TextPart extends BasePart {
  type: 'text';
  text: string;
}

export interface ReasoningPart extends BasePart {
  type: 'reasoning';
  text: string;
  time: { start: number; end?: number };
}

export interface FilePart extends BasePart {
  type: 'file';
  mime: string;
  url: string;
  filename?: string;
}

export interface ToolPart extends BasePart {
  type: 'tool';
  callID: string;
  tool: string;
  state: unknown;
}

export interface StepStartPart extends BasePart {
  type: 'step_start';
  title?: string;
}

export interface StepFinishPart extends BasePart {
  type: 'step_finish';
  title?: string;
}

export interface SnapshotPart extends BasePart {
  type: 'snapshot';
  // schema includes more; keep unknown for now
  [key: string]: unknown;
}

export interface PatchPart extends BasePart {
  type: 'patch';
  hash: string;
  files: string[];
}

export interface AgentPart extends BasePart {
  type: 'agent';
  name: string;
  source?: { value: string; start: number; end: number };
}

export interface RetryPart extends BasePart {
  type: 'retry';
  [key: string]: unknown;
}

export interface CompactionPart extends BasePart {
  type: 'compaction';
  [key: string]: unknown;
}

export interface UnknownPart extends BasePart {
  type: 'unknown';
  originalType: string;
  [key: string]: unknown;
}

export interface MessageResponse {
  info: AssistantMessage;
  parts: OpenCodePart[];
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

// --- UI Enhancement Types (Phase 1) ---

// Extended message type for UI state management
export interface UiMessage {
  id: string;
  kind: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  error?: string;
}

// UI state management
export interface UIState {
  isLoading: boolean;
  isConnected: boolean;
  error: string | null;
}

// --- Chat Persistence Types (Phase 5: Standard Chat Page) ---

export interface MessageUsage {
  inputTokens?: number;
  outputTokens?: number;
  totalTokens?: number;
}

export interface ChatMessage {
  id: string; // UUID v4
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number; // Unix timestamp
  usage?: MessageUsage;
}

export interface SessionUsage {
  totalInputTokens: number;
  totalOutputTokens: number;
  totalTokens: number;
}

export interface ChatSession {
  id: string; // UUID v4
  name: string;
  modelId: string; // Format: "providerId/modelId"
  messages: ChatMessage[];
  usage: SessionUsage;
  createdAt: number; // Unix timestamp
  updatedAt: number; // Unix timestamp
}

// Extended plugin data with chat persistence
export interface PluginData extends ServiceSettings {
  sessions: ChatSession[];
  activeSessionId?: string;
}

export const MAX_MESSAGES_PER_SESSION = 1000;

export function trimSessionMessages(messages: ChatMessage[], maxMessages: number = MAX_MESSAGES_PER_SESSION): ChatMessage[] {
  if (messages.length <= maxMessages) {
    return messages;
  }
  return messages.slice(messages.length - maxMessages);
}

export const defaultPluginData: PluginData = {
  ...defaultSettings,
  sessions: [],
  activeSessionId: undefined
};

// Type guards for validation
export function isPluginData(data: unknown): data is PluginData {
  if (!data || typeof data !== 'object') return false;
  const d = data as Record<string, unknown>;
  if (typeof d.serviceUrl !== 'string') return false;
  if (!Array.isArray(d.sessions)) return false;
  return true;
}

export function asPluginData(data: unknown): PluginData {
  if (!isPluginData(data)) {
    const serviceUrl =
      typeof (data as { serviceUrl?: unknown } | null)?.serviceUrl === 'string'
        ? ((data as { serviceUrl?: string }).serviceUrl ?? defaultSettings.serviceUrl)
        : defaultSettings.serviceUrl;
    return { ...defaultPluginData, serviceUrl };
  }
  return data;
}

export function isChatMessage(msg: unknown): msg is ChatMessage {
  if (!msg || typeof msg !== 'object') return false;
  const m = msg as Record<string, unknown>;
  if (typeof m.id !== 'string') return false;
  if (typeof m.role !== 'string' || !['user', 'assistant', 'system'].includes(m.role)) return false;
  if (typeof m.content !== 'string') return false;
  if (typeof m.timestamp !== 'number') return false;
  return true;
}

export function asChatMessage(msg: unknown): ChatMessage {
  if (!isChatMessage(msg)) {
    return {
      id: crypto.randomUUID(),
      role: 'user',
      content: String(msg || ''),
      timestamp: Date.now()
    };
  }
  return msg;
}

export function isChatSession(session: unknown): session is ChatSession {
  if (!session || typeof session !== 'object') return false;
  const s = session as Record<string, unknown>;
  if (typeof s.id !== 'string') return false;
  if (typeof s.name !== 'string') return false;
  if (typeof s.modelId !== 'string') return false;
  if (!Array.isArray(s.messages)) return false;
  if (typeof s.createdAt !== 'number') return false;
  if (typeof s.updatedAt !== 'number') return false;
  return true;
}

export function asChatSession(session: unknown): ChatSession {
  if (!isChatSession(session)) {
    return {
      id: crypto.randomUUID(),
      name: 'New Chat',
      modelId: 'default',
      messages: [],
      usage: { totalInputTokens: 0, totalOutputTokens: 0, totalTokens: 0 },
      createdAt: Date.now(),
      updatedAt: Date.now()
    };
  }
  return session;
}
