import { Body, Controller, Post } from "@nestjs/common";
import { ChatRequestDto } from "./chat.dto";
import { ChatService } from "./chat.service";

@Controller("chat")
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  async chat(@Body() body: ChatRequestDto) {
    const message = await this.chatService.reply(body.messages, body.language);
    return { message };
  }
}
