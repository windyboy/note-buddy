import ky from "ky";
import { PluginSettings, QueryRequest, QueryResponse } from "../models/types";

export class OpencodeService {
  private settings: PluginSettings;

  constructor(settings: PluginSettings) {
    this.settings = settings;
  }

  private get client() {
    return ky.create({
      prefixUrl: this.settings.serverUrl,
      headers: {
        Authorization: `Bearer ${this.settings.apiKey}`,
      },
      timeout: 30000,
    });
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.client
        .get("global/health")
        .json<{ status: string }>();
      return response.status === "ok";
    } catch (error) {
      if (this.settings.debugMode) {
        console.error("Opencode health check failed:", error);
      }
      return false;
    }
  }

  async sendMessage(
    sessionID: string,
    prompt: string,
    context?: string[],
  ): Promise<QueryResponse> {
    const payload: QueryRequest = {
      prompt,
      sessionID,
      context,
    };

    try {
      return await this.client
        .post(`session/${sessionID}/message`, {
          json: payload,
        })
        .json<QueryResponse>();
    } catch (error) {
      if (this.settings.debugMode) {
        console.error("Failed to send message to Opencode:", error);
      }
      throw error;
    }
  }
}
