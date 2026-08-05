import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { MessageDto } from "./chat.dto";

type ProviderResponse = {
  choices?: Array<{ message?: { content?: string } }>;
  error?: { message?: string };
};

@Injectable()
export class ChatService {
  async reply(messages: MessageDto[], language: "en" | "fr" | "ar" = "en"): Promise<string> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException(
        "The AI service has not been configured yet.",
      );
    }

    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(
      /\/$/,
      "",
    );
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30_000);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          temperature: 0.7,
          max_tokens: 700,
          messages: [
            {
              role: "system",
              content: `You are the concise, friendly AI calling assistant for VR Digital Calling. Help users prepare calls, improve scripts, answer communication questions, and write follow-ups. Be practical, professional, and easy to understand. Always reply in ${{ en: "English", fr: "French", ar: "Arabic" }[language]}.`,
            },
            ...messages,
          ],
        }),
        signal: controller.signal,
      });

      const data = (await response.json()) as ProviderResponse;
      if (!response.ok) {
        throw new Error(data.error?.message || "AI provider request failed");
      }

      const content = data.choices?.[0]?.message?.content?.trim();
      if (!content) throw new Error("AI provider returned an empty response");
      return content;
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        throw new BadGatewayException("The AI service took too long to respond.");
      }
      throw new BadGatewayException("The AI assistant is temporarily unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
