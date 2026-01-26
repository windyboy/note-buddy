import { requestUrl, RequestUrlParam } from 'obsidian';
import { ConnectionState, ConnectionStatus, SessionState, SendMessage, MessageResponse, MessagePart, ModelDescriptor } from './models';

export class OpenCodeClient {
  private serviceUrl: string;
  private session: SessionState | null = null;
  private cachedModels: ModelDescriptor[] | null = null;
  private modelsCacheTime: number = 0;
  private readonly MODELS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes
  private defaultModelId?: string;

  constructor(serviceUrl: string, defaultModelId?: string) {
    this.serviceUrl = serviceUrl;
    this.defaultModelId = defaultModelId;
  }

  private async request(options: RequestUrlParam): Promise<any> {
    return await Promise.race([
      requestUrl(options),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timeout after 10 seconds')), 10000)
      )
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
    if (this.cachedModels && (now - this.modelsCacheTime) < this.MODELS_CACHE_TTL) {
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
        const data = response.json;
        return {
          sessionID: data.sessionID,
          createTime: data.createTime,
          title: data.title,
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
      const response = await this.request({
        url,
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(message),
      });

      if (response.status === 200) {
        return response.json as MessageResponse;
      } else if (response.status === 404) {
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
    const response = await this.sendMessageInternal(this.session.sessionID, message);

    // Extract assistant text
    const assistantParts = response.parts.filter((part: MessagePart) => part.role === 'assistant');
    const assistantText = assistantParts.map((part: MessagePart) => part.text).join('\n');

    return assistantText;
  }

  async sendMessageToSession(sessionID: string, message: SendMessage): Promise<MessageResponse> {
    return await this.sendMessageInternal(sessionID, message);
  }
}