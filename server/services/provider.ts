import axios, { AxiosInstance } from "axios";
import { db } from "../db";
import { providersLog } from "@shared/schema";
import { modelSelector } from "./modelSelector.js";

export interface GenerateAnswerRequest {
  question: string;
  systemPrompt?: string;
}

export interface GenerateAnswerResponse {
  answer: string;
  confidence?: number;
  latency?: number;
}

export class ProviderManager {
  private client: AxiosInstance;
  private lmStudioUrl: string;

  constructor() {
    this.lmStudioUrl = process.env.LM_STUDIO_URL || "http://localhost:1234";
    this.client = axios.create({
      baseURL: this.lmStudioUrl,
      timeout: 60000,
    });
  }

  async generateAnswer(req: GenerateAnswerRequest): Promise<GenerateAnswerResponse> {
    const startTime = Date.now();
    const systemPrompt = req.systemPrompt || this.getDefaultSystemPrompt();
    const model = modelSelector.getModel();
    console.log(`[Provider] Using model for generateAnswer: ${model}`);

    try {
      const response = await this.client.post("/v1/chat/completions", {
        model: model,
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: req.question },
        ],
        temperature: 0.1,
        max_tokens: 500,
        stream: false,
      });

      const latency = Date.now() - startTime;
      const content = response.data.choices?.[0]?.message?.content || "";

      await this.logProvider("lm-studio", model, "success", latency);

      return {
        answer: content.trim(),
        confidence: 0.95,
        latency,
      };
    } catch (error: any) {
      const latency = Date.now() - startTime;
      const errorCode = error.code === "ECONNREFUSED" ? "PROVIDER_OFFLINE" : "PROVIDER_ERROR";

      await this.logProvider("lm-studio", model, "error", latency, errorCode);

      console.error(`[CRITICAL] LM Studio call failed:`, error.message);
      throw error;
    }
  }

  async generateFeedback(answer: string, expectedCategory: string, errorType: string): Promise<string> {
    const model = modelSelector.getModel();
    try {
      const prompt = `You are a teacher helping an AI named Zeus learn. Zeus just tried to answer about ${expectedCategory}.

Zeus's answer: "${answer}"
Error: ${errorType}

Give ONE sentence of clear, helpful feedback to help Zeus improve. Keep it short.`;

      const response = await this.client.post("/v1/chat/completions", {
        model: model,
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 200,
        stream: false,
      });

      return response.data.choices?.[0]?.message?.content?.trim() || "Try observing the metric more carefully.";
    } catch (error: any) {
      console.error(`[FEEDBACK] LM Studio call failed:`, error.message);
      throw error;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get("/v1/models", { timeout: 5000 });
      return response.status === 200 && response.data.data && response.data.data.length > 0;
    } catch {
      return false;
    }
  }

  private getDefaultSystemPrompt(): string {
    return `You are Zeus, an AI learning system. You must answer questions about system metrics strictly and literally.

RULES:
1. Answer ONLY in the format: "<metric> is <value>."
2. ONE sentence only
3. ONE metric only
4. Do NOT explain, interpret, or add extra clauses
5. Do NOT use speculative language like "seems" or "appears"

Example:
Q: "CPU Load = 50%. Describe."
A: "CPU load is 50%."

Answer now:`;
  }

  private async logProvider(
    provider: string,
    model: string,
    status: string,
    latency: number,
    errorCode?: string,
  ): Promise<void> {
    try {
      await db.insert(providersLog).values({
        providerName: provider,
        model,
        status,
        errorCode: errorCode || null,
        latency,
      });
    } catch {
      // Silent fail on logging
    }
  }
}

export const providerManager = new ProviderManager();
