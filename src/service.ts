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
  OpenCodeModelRef,
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
  private pendingCapabilitiesRequest: Promise<Provider[]> | null = null;
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
  private static readonly CAPABILITIES_MAX_RETRIES = 2;
  private static readonly RETRY_BASE_DELAY_MS = 200;

  private async request(
    options: RequestUrlParam,
    timeoutMs: number = OpenCodeClient.DEFAULT_REQUEST_TIMEOUT_MS
  ): Promise<{ status: number; json: unknown; text: string }> {
    return await Promise.race([
      requestUrl(options) as Promise<{ status: number; json: unknown; text: string }>,
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

      const payload = response.json as { healthy?: boolean };
      if (response.status === 200 && payload.healthy === true) {
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

  private async sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private shouldRetryCapabilities(error: unknown): boolean {
    const message = error instanceof Error ? error.message.toLowerCase() : '';
    return message.includes('timeout') || message.includes('failed to get capabilities') || message.includes('http 5');
  }

  private parseMessageResponse(rawText: string): MessageResponse {
    let parsed: unknown;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      throw new Error(`Invalid JSON response: ${rawText.slice(0, 50)}${rawText.length > 50 ? '...' : ''}`);
    }

    if (!parsed || typeof parsed !== 'object' || !Array.isArray((parsed as { parts?: unknown }).parts)) {
      throw new Error('Invalid response shape (expected {info, parts[]})');
    }

    return parsed as MessageResponse;
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
        const data = this.parseMessageResponse(raw);
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

    if (!forceRefresh && this.pendingCapabilitiesRequest) {
      return this.pendingCapabilitiesRequest;
    }

    // OpenCode API: GET /config/providers (see opencode-api.json)
    const url = `${this.serviceUrl}/config/providers`;

    const fetchCapabilities = async (): Promise<Provider[]> => {
      let attempt = 0;
      while (attempt <= OpenCodeClient.CAPABILITIES_MAX_RETRIES) {
        try {
          const response = await this.request({
            url,
            method: 'GET',
          });

          if (response.status === 200) {
            const data = response.json as OpenCodeConfigProvidersResponse;
            const raw: OpenCodeProvider[] = data.providers || [];
            this.cachedDefaults = data.default || {};
            // OpenCode returns providers[].models as object { [modelId]: Model }; normalize to Provider[] with models array
            const providers: Provider[] = raw.map((p: OpenCodeProvider) => ({
              id: p.id,
              name: p.name,
              models: Object.entries(p.models || {}).map(([id, m]) => ({ id, name: m?.name ?? id })),
            }));
            this.cachedProviders = providers;
            this.providersCacheTime = Date.now();
            return providers;
          }

          if (response.status >= 500 && attempt < OpenCodeClient.CAPABILITIES_MAX_RETRIES) {
            const delay = OpenCodeClient.RETRY_BASE_DELAY_MS * (2 ** attempt);
            await this.sleep(delay);
            attempt += 1;
            continue;
          }

          throw new Error(`HTTP ${response.status}: ${response.text}`);
        } catch (error) {
          if (attempt < OpenCodeClient.CAPABILITIES_MAX_RETRIES && this.shouldRetryCapabilities(error)) {
            const delay = OpenCodeClient.RETRY_BASE_DELAY_MS * (2 ** attempt);
            await this.sleep(delay);
            attempt += 1;
            continue;
          }
          const err = error as Error;
          throw new Error(`Failed to get capabilities: ${err.message}`);
        }
      }
      throw new Error('Failed to get capabilities: exhausted retries');
    };

    this.pendingCapabilitiesRequest = fetchCapabilities();
    try {
      return await this.pendingCapabilitiesRequest;
    } finally {
      this.pendingCapabilitiesRequest = null;
    }
  }

  async sendMessageAndGetText(input: string, signal: AbortSignal, modelIdOverride?: string): Promise<string> {
    if (!this.session) {
      this.session = await this.createSession();
    }

    const messageModel = this.toModelRef(modelIdOverride ?? this.defaultModelId);
    const message: SendMessage = {
      parts: [{ type: 'text', text: input }],
      ...(messageModel ? { model: messageModel } : {}),
    };

    try {
      let assistantText: string;
      try {
        assistantText = await this.sendStreamRequest(this.session.sessionID, message);
      } catch (error) {
        const err = error as Error;
        // Fallback to server default if model is unavailable
        if (message.model && this.isLikelyModelError(err)) {
          console.log('[NoteBuddy] Selected model unavailable, falling back to server default');
          if (this.onModelUnavailable) {
            this.onModelUnavailable();
          }
          assistantText = await this.sendStreamRequest(this.session.sessionID, { parts: message.parts });
        } else {
          throw error;
        }
      }

      return assistantText;
    } catch (error) {
      if (signal.aborted) {
        throw Object.assign(new Error('Aborted'), { name: 'AbortError' });
      }
      throw error;
    }
  }

  async *streamMessage(input: string, signal: AbortSignal, modelIdOverride?: string): AsyncGenerator<string> {
    yield await this.sendMessageAndGetText(input, signal, modelIdOverride);
  }

  private isLikelyModelError(err: Error): boolean {
    const msg = (err.message || '').toLowerCase();
    return msg.includes('model') && (msg.includes('not found') || msg.includes('invalid') || msg.includes('unknown'));
  }

  private toModelRef(modelId?: string): OpenCodeModelRef | undefined {
    if (!modelId) {
      return undefined;
    }

    const parts = modelId.split('/');
    if (parts.length !== 2 || !parts[0] || !parts[1]) {
      return undefined;
    }

    return {
      providerID: parts[0],
      modelID: parts[1],
    };
  }

  private async sendStreamRequest(sessionID: string, message: SendMessage): Promise<string> {
    const response = await this.request(
      {
        url: `${this.serviceUrl}/session/${sessionID}/message`,
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
      const data = this.parseMessageResponse(raw);
      return data.parts
        .filter((part: OpenCodePart) => part.type === 'text')
        .map((part: OpenCodePart) => (part.type === 'text' ? part.text : ''))
        .filter(Boolean)
        .join('\n');
    }

    if (response.status === 400) {
      const payload = response.json as BadRequestError;
      throw new Error(this.formatBadRequest(payload, response.text));
    }

    if (response.status === 404) {
      const payload = response.json as NotFoundError;
      throw new Error(`Session not found: ${this.formatNotFound(payload, response.text)}`);
    }

    throw new Error(`HTTP ${response.status}: ${response.text}`);
  }
}
