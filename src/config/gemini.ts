import { GoogleGenerativeAI } from "@google/generative-ai";
import logger from "@/shared/utils/logger";
import { config } from "./env";

class GeminiConfig {
  private geminiClient: GoogleGenerativeAI | null = null;
  private isInitialized: boolean = false;

  constructor() {
    this.initialize();
  }

  private initialize(): void {
    try {
      const apiKey = config.GEMINI_API_KEY;

      if (!apiKey || apiKey === "your_gemini_api_key_here") {
        logger.warn(
          "⚠️ Gemini API key not found. AI features will be disabled."
        );
        return;
      }

      this.geminiClient = new GoogleGenerativeAI(apiKey);
      this.isInitialized = true;
      logger.info("🤖 Gemini AI initialized successfully");
    } catch (error) {
      logger.error("Failed to initialize Gemini AI:", error);
    }
  }

  public isReady(): boolean {
    return this.isInitialized && this.geminiClient !== null;
  }

  public async chatCompletion(
    messages: Array<{ role: "system" | "user" | "assistant"; content: string }>,
    options?: {
      model?: string;
      maxTokens?: number;
      temperature?: number;
    }
  ): Promise<string> {
    if (!this.isReady()) {
      throw new Error("Gemini AI service is not initialized");
    }

    const maxTokens = options?.maxTokens || config.AI_MAX_TOKENS;
    const temperature = options?.temperature || config.AI_TEMPERATURE;

    // Thử các models mới nhất trước
    const modelsToTry = [
      options?.model || config.GEMINI_MODEL,
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
    ].filter((m, i, arr) => m && arr.indexOf(m) === i); // Remove duplicates

    for (const modelName of modelsToTry) {
      try {
        logger.info(`🔄 Using model: ${modelName}`);
        if (!modelName) {
          continue;
        }

        const geminiModel = this.geminiClient!.getGenerativeModel({
          model: modelName,
        });

        // Build prompt từ messages
        let systemPrompt = "";
        const conversationParts: string[] = [];

        messages.forEach((msg) => {
          if (msg.role === "system") {
            systemPrompt = msg.content;
          } else if (msg.role === "user") {
            conversationParts.push(msg.content);
          } else if (msg.role === "assistant") {
            conversationParts.push(`Previous response: ${msg.content}`);
          }
        });

        let finalPrompt = "";
        if (systemPrompt) {
          finalPrompt = `${systemPrompt}\n\n`;
        }
        finalPrompt += conversationParts.join("\n\n");
        const tokenInfo = await geminiModel.countTokens(finalPrompt);
        console.log("token-count: ", tokenInfo.totalTokens);
        // Gọi API với format đơn giản
        const result = await geminiModel.generateContent(finalPrompt);
        console.log("result: ", JSON.stringify(result, null, 2));
        const response = result.response;
        const text = response.text();

        if (text) {
          logger.info(`✅ Successfully used model: ${modelName}`);
          return text;
        }
      } catch (error: any) {
        logger.warn(`❌ Model ${modelName} failed: ${error.message}`);
        continue; // Thử model tiếp theo
      }
    }

    throw new Error(
      "All models failed. Please check your API key and internet connection."
    );
  }

  // Thêm method mới để list models
  public async listAvailableModels(): Promise<any[]> {
    if (!this.isReady()) {
      throw new Error("Gemini AI service is not initialized");
    }

    try {
      const apiKey = config.GEMINI_API_KEY;
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
      );

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: any = await response.json();
      return data.models || [];
    } catch (error: any) {
      logger.error("Error listing models:", error);
      throw error;
    }
  }
}

export default new GeminiConfig();
