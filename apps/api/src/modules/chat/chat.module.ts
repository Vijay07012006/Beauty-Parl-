import { Module } from '@nestjs/common';
import { ChatGateway } from './chat.gateway';
import { AiChatModule } from '../ai-chat/ai-chat.module';

@Module({
  imports: [AiChatModule],
  providers: [ChatGateway],
  exports: [ChatGateway],
})
export class ChatModule {}
