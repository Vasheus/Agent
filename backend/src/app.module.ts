import { Module } from "@nestjs/common";
import { ChatController } from "./chat/chat.controller";
import { ChatService } from "./chat/chat.service";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController, ChatController],
  providers: [ChatService],
})
export class AppModule {}

