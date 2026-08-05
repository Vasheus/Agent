import {
  BadGatewayException,
  Injectable,
  InternalServerErrorException,
} from "@nestjs/common";
import { MessageDto } from "./chat.dto";

type ProviderError = { error?: { message?: string } };
type StreamChunk = { choices?: Array<{ delta?: { content?: string } }> };

@Injectable()
export class ChatService {
  async *streamReply(
    messages: MessageDto[],
    language: "en" | "fr" | "ar" = "en",
  ): AsyncGenerator<string> {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) {
      throw new InternalServerErrorException("The AI service has not been configured yet.");
    }

    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/$/, "");
    const model = process.env.AI_MODEL || "gpt-4o-mini";
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60_000);

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
          stream: true,
          messages: [
            {
              role: "system",
              content: `You are the concise, friendly AI calling assistant for VR Digital Calling. Help users prepare calls, improve scripts, answer communication questions, and write follow-ups. Be practical, professional, and easy to understand. Use clear Markdown when structure helps. Always reply in ${{ en: "English", fr: "French", ar: "Arabic" }[language]}.`,
            },
            ...messages,
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        const data = (await response.json().catch(() => ({}))) as ProviderError;
        throw new BadGatewayException(data.error?.message || "AI provider request failed");
      }
      if (!response.body) throw new BadGatewayException("AI provider returned no response stream");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        buffer += decoder.decode(value, { stream: !done });
        const events = buffer.split("\n\n");
        buffer = events.pop() || "";

        for (const event of events) {
          for (const line of event.split("\n")) {
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data || data === "[DONE]") continue;
            const chunk = JSON.parse(data) as StreamChunk;
            const content = chunk.choices?.[0]?.delta?.content;
            if (content) yield content;
          }
        }

        if (done) break;
      }
    } catch (error) {
      if (error instanceof BadGatewayException || error instanceof InternalServerErrorException) throw error;
      if (error instanceof Error && error.name === "AbortError") {
        throw new BadGatewayException("The AI service took too long to respond.");
      }
      throw new BadGatewayException("The AI assistant is temporarily unavailable.");
    } finally {
      clearTimeout(timeout);
    }
  }
}
