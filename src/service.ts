import { requestUrl, RequestUrlParam } from 'obsidian';
import {
  BadRequestError,
  ConnectionState,
  ConnectionStatus,
  MessageResponse,
  NotFoundError,
  OpenCodeConfigProvidersResponse,
  OpenCodeProvider,
  OpenCodeSession,
  OpenCodePart,
  Provider,
  SendMessage,
  SessionState,
  MODELS_CACHE_TTL,
} from './models';

export class OpenCodeClient {
  private serviceUrl: string;
  private session: SessionState | null = null;
  private cachedProviders: Provider[] | null = null;
  private providersCacheTime: number = 0;
  private cachedDefaults: Record<string, string> | null = null;
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
        const data = response.json as OpenCodeSession;
        return {
          sessionID: data.id,
          createTime: data.time.created,
          title: data.title,
        };
      }

      if (response.status === 400) {
        const details = this.formatBadRequest(response.json as BadRequestError, response.text);
        throw new Error(details);
      }

      throw new Error(`HTTP ${response.status}: ${response.text}`);
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to create session: ${err.message}`);
    }
  }

  private formatBadRequest(payload: BadRequestError | unknown, fallbackText: string): string {
    if (!payload || typeof payload !== 'object') {
      return `Bad request: ${fallbackText || 'Unknown error'}`;
    }
    const p = payload as Partial<BadRequestError>;
    const errText =
      typeof p.errors === 'string'
        ? p.errors
        : p.errors
          ? JSON.stringify(p.errors)
          : '';
    const dataText = p.data ? JSON.stringify(p.data) : '';
    const msg = [errText, dataText].filter(Boolean).join(' ');
    return msg ? `Bad request: ${msg}` : `Bad request: ${fallbackText || 'Unknown error'}`;
  }

  private formatNotFound(payload: NotFoundError | unknown, fallbackText: string): string {
    if (!payload || typeof payload !== 'object') {
      return fallbackText || 'Not found';
    }
    const p = payload as Partial<NotFoundError>;
    const name = typeof p.name === 'string' ? p.name : '';
    const data = p.data ? JSON.stringify(p.data) : '';
    return [name, data].filter(Boolean).join(' ') || fallbackText || 'Not found';
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
        if (!data || typeof data !== 'object' || !Array.isArray((data as any).parts)) {
          throw new Error('Invalid response shape (expected {info, parts[]})');
        }
        return data;
      }

      if (response.status === 400) {
        // Contract: BadRequestError
        const payload = response.json as BadRequestError;
        throw new Error(this.formatBadRequest(payload, response.text));
      }

      if (response.status === 404) {
        // Contract: NotFoundError (session not found)
        const payload = response.json as NotFoundError;
        throw new Error(`Session not found: ${this.formatNotFound(payload, response.text)}`);
      }

      throw new Error(`HTTP ${response.status}: ${response.text}`);
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
      parts: [{ type: 'text', text: input }],
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
      if (message.model && this.isLikelyModelError(err)) {
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
    const assistantText = response.parts
      .filter((part: OpenCodePart) => part.type === 'text')
      .map((part: OpenCodePart) => (part.type === 'text' ? part.text : ''))
      .filter(Boolean)
      .join('\n');

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
    this.cachedDefaults = null;
  }

  /**
   * Fetches available AI providers and models from the OpenCode server.
   *
   * Results are cached for 5 minutes to reduce API calls. The cache can be bypassed
   * by setting forceRefresh to true or by calling clearModelsCache() first.
   *
   * @param forceRefresh - If true, bypasses cache and fetches fresh data from server
   * @returns Array of providers with their available models
   * @throws Error if the server is unreachable, returns invalid JSON, or responds with non-200 status
   */
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
        let data: OpenCodeConfigProvidersResponse;
        try {
          data = response.json as OpenCodeConfigProvidersResponse;
        } catch {
          const preview = (response.text || '').trim().slice(0, 50);
          if (preview.toLowerCase().startsWith('<!')) {
            throw new Error(
              'Server returned HTML instead of JSON. Check the Service URL and ensure the server exposes /config/providers.'
            );
          }
          throw new Error(`Invalid JSON response: ${preview}...`);
        }

        const raw: OpenCodeProvider[] = data.providers || [];
        this.cachedDefaults = data.default || {};
        // OpenCode returns providers[].models as object { [modelId]: Model }; normalize to Provider[] with models array
        const providers: Provider[] = raw.map((p: OpenCodeProvider) => ({
          id: p.id,
          name: p.name,
          models: Object.entries(p.models || {}).map(([id, m]) => ({ id, name: m?.name ?? id })),
        }));
        this.cachedProviders = providers;
        this.providersCacheTime = now;
        return providers;
      } else {
        throw new Error(`HTTP ${response.status}: ${response.text}`);
      }
    } catch (error) {
      const err = error as Error;
      throw new Error(`Failed to get capabilities: ${err.message}`);
    }
  }

  private isLikelyModelError(err: Error): boolean {
    const msg = (err.message || '').toLowerCase();
    // Best-effort heuristic for common server-side error strings when model is invalid.
    // The contract provides structured errors on AssistantMessage.info.error, but request validation errors may surface as BadRequestError.
    return msg.includes('model') && (msg.includes('not found') || msg.includes('invalid') || msg.includes('unknown'));
  }
}