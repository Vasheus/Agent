import { Body, Controller, Post, Res } from "@nestjs/common";
import { Response } from "express";
import { ChatRequestDto } from "./chat.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestDto, @Res() response: Response) {
    const stream = this.chatService.streamReply(body.messages, body.language);
    const iterator = stream[Symbol.asyncIterator]();

    try {
      const first = await iterator.next();
      response.status(200);
      response.setHeader("Content-Type", "text/plain; charset=utf-8");
      response.setHeader("Cache-Control", "no-cache, no-transform");
      response.setHeader("X-Content-Type-Options", "nosniff");
      response.flushHeaders();

      if (!first.done) response.write(first.value);
      while (true) {
        const next = await iterator.next();
        if (next.done) break;
        response.write(next.value);
      }
      response.end();
    } catch (error) {
      if (!response.headersSent) throw error;
      response.end();
    }
  }
}
