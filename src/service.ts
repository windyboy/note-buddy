import { requestUrl, RequestUrlParam, Notice } from 'obsidian';
import { ConnectionState, ConnectionStatus, SessionState, SendMessage, MessageResponse, MessagePart, ModelDescriptor, Provider, ModelSelection, MODELS_CACHE_TTL } from './models';

export class OpenCodeClient {
  private serviceUrl: string;
  private session: SessionState | null = null;
  private cachedModels: ModelDescriptor[] | null = null;
  private modelsCacheTime: number = 0;
  private cachedProviders: Provider[] | null = null;
  private providersCacheTime: number = 0;
  private defaultModelId?: string;
  private onModelUnavailable?: () => void;

  constructor(serviceUrl: string, defaultModelId?: string, onModelUnavailable?: () => void) {
    this.serviceUrl = serviceUrl;
    this.defaultModelId = defaultModelId;
    this.onModelUnavailable = onModelUnavailable;
  }

  private static readonly DEFAULT_REQUEST_TIMEOUT_MS = 10_000;
  private static readonly MESSAGE_REQUEST_TIMEOUT_MS = 60_000;

  private async request(options: RequestUrlParam, timeoutMs: number = OpenCodeClient.DEFAULT_REQUEST_TIMEOUT_MS): Promise<any> {
    return await Promise.race([
      requestUrl(options),
      new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error(`Request timeout after ${timeoutMs / 1000} seconds`)), timeoutMs)
      ),
    ]);
  }

  async healthCheck(): Promise<ConnectionState> {
    const url = `${this.serviceUrl}/global/health`;

    try {
      const response = await this.request({
        url,
        method: 'GET',
      });

      if (response.status === 200 && response.json.healthy === true) {
        return {
          status: ConnectionStatus.Connected,
          lastTestTime: Date.now(),
        };
      } else {
        return {
          status: ConnectionStatus.Disconnected,
          lastTestTime: Date.now(),
          lastError: `Service unhealthy or unreachable`,
        };
      }
    } catch (error) {
      const err = error as Error;
      return {
        status: ConnectionStatus.Disconnected,
        lastTestTime: Date.now(),
        lastError: err.message || 'Unknown error',
      };
    }
  }

  async discoverModels(): Promise<ModelDescriptor[]> {
    const now = Date.now();
    if (this.cachedModels && (now - this.modelsCacheTime) < MODELS_CACHE_TTL) {
      return this.cachedModels;
    }

    const url = `${this.serviceUrl}/v1/models`;

    try {
      const response = await this.request({
        url,
        method: 'GET',
      });

      if (response.status === 200) {
        const models = response.json.data || response.json;
        this.cachedModels = models;
        this.modelsCacheTime = now;
        return models;
      } else if (response.status === 404) {
        // Endpoint not supported, return empty list
        this.cachedModels = [];
        this.modelsCacheTime = now;
        return [];
      } else {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to discover models: ${err.message}`);
    }
  }

  async createSession(): Promise<SessionState> {
    const url = `${this.serviceUrl}/session`;

    try {
      const response = await this.request({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });

      if (response.status === 200) {
        const data = response.json as Record<string, unknown>;
        // Contract (opencode-api.json) uses Session.id and Session.time.created
        const sessionID = (data.id ?? data.sessionID) as string;
        const time = data.time as { created?: number; updated?: number } | undefined;
        const createTime = (time?.created ?? data.createTime) as number;
        return {
          sessionID,
          createTime,
          title: data.title as string | undefined,
        };
      } else {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to create session: ${err.message}`);
    }
  }

  private async sendMessageInternal(sessionID: string, message: SendMessage): Promise<MessageResponse> {
    const url = `${this.serviceUrl}/session/${sessionID}/message`;

    try {
      const response = await this.request(
        {
          url,
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(message),
        },
        OpenCodeClient.MESSAGE_REQUEST_TIMEOUT_MS
      );

      if (response.status === 200) {
        const raw = (response.text ?? '').trim();
        if (!raw) {
          throw new Error('Server returned empty response');
        }
        let data: MessageResponse;
        try {
          data = JSON.parse(raw) as MessageResponse;
        } catch {
          throw new Error(`Invalid JSON response: ${raw.slice(0, 50)}${raw.length > 50 ? '...' : ''}`);
        }
        return data;
      } else if (response.status === 404) {
        const errMessage = response.text || 'Session not found';
        if (errMessage.includes('model') || errMessage.includes('Model')) {
          throw new Error('Model not found');
        }
        throw new Error('Session not found');
      } else {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to send message: ${err.message}`);
    }
  }

  async sendMessage(input: string): Promise<string> {
    // Ensure session exists
    if (!this.session) {
      this.session = await this.createSession();
    }

    // Create message
    const message: SendMessage = {
      parts: [{ text: input, role: 'user', type: 'text' }],
    };

    // Set model if defaultModelId is configured
    if (this.defaultModelId) {
      const parts = this.defaultModelId.split('/');
      if (parts.length === 2) {
        message.model = {
          providerID: parts[0],
          modelID: parts[1],
        };
      }
    }

    // Send message
    let response: MessageResponse;
    try {
      response = await this.sendMessageInternal(this.session.sessionID, message);
    } catch (error) {
      const err = error as Error;
      // Fallback to server default if model is unavailable
      if (err.message === 'Model not found' && message.model) {
        console.log('[NoteBuddy] Selected model unavailable, falling back to server default');
        if (this.onModelUnavailable) {
          this.onModelUnavailable();
        }
        const fallbackMessage: SendMessage = {
          parts: message.parts,
        };
        response = await this.sendMessageInternal(this.session.sessionID, fallbackMessage);
      } else {
        throw error;
      }
    }

    // Extract assistant text
    const assistantParts = response.parts.filter((part: MessagePart) => part.role === 'assistant');
    const assistantText = assistantParts.map((part: MessagePart) => part.text).join('\n');

    return assistantText;
  }

  async sendMessageToSession(sessionID: string, message: SendMessage): Promise<MessageResponse> {
    return await this.sendMessageInternal(sessionID, message);
  }

  isModelsCacheValid(): boolean {
    if (!this.cachedProviders) {
      return false;
    }
    const now = Date.now();
    return (now - this.providersCacheTime) < MODELS_CACHE_TTL;
  }

  clearModelsCache(): void {
    this.cachedProviders = null;
    this.providersCacheTime = 0;
  }

  async getCapabilities(forceRefresh: boolean = false): Promise<Provider[]> {
    const now = Date.now();
    
    // Return cached data if valid and not forcing refresh
    if (!forceRefresh && this.cachedProviders && (now - this.providersCacheTime) < MODELS_CACHE_TTL) {
      return this.cachedProviders;
    }

    // OpenCode API: GET /config/providers (see opencode-api.json)
    const url = `${this.serviceUrl}/config/providers`;

    try {
      const response = await this.request({
        url,
        method: 'GET',
      });

      if (response.status === 200) {
        type OpenCodeProvider = { id: string; name: string; models?: Record<string, { id?: string; name?: string }> };
        let data: { providers?: OpenCodeProvider[] };
        try {
          data = response.json;
        } catch {
          const preview = (response.text || '').trim().slice(0, 50);
          if (preview.toLowerCase().startsWith('<!')) {
            throw new Error(
              'Server returned HTML instead of JSON. Check the Service URL and ensure the server exposes /config/providers.'
            );
          }
          throw new Error(`Invalid JSON response: ${preview}...`);
        }
        const raw = data.providers || [];
        // OpenCode returns providers[].models as object { [modelId]: Model }; normalize to Provider[] with models array
        const providers: Provider[] = raw.map((p: OpenCodeProvider) => ({
          id: p.id,
          name: p.name,
          models: Object.entries(p.models || {}).map(([id, m]) => ({ id, name: m?.name ?? id })),
        }));
        this.cachedProviders = providers;
        this.providersCacheTime = now;
        return providers;
      } else if (response.status === 404) {
        // Endpoint not supported, return empty list
        const emptyProviders: Provider[] = [];
        this.cachedProviders = emptyProviders;
        this.providersCacheTime = now;
        return emptyProviders;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to get capabilities: ${err.message}`);
    }
  }
}