import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../products/product.entity';
import { Order } from '../orders/order.entity';
import { User } from '../auth/user.entity';
import { AiConversation } from './entities/ai-conversation.entity';
import { AiGeneration } from './entities/ai-generation.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { AiAssistantService } from './ai-assistant.service';
import { AiAssistantController } from './ai-assistant.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Order,
      User,
      AiConversation,
      AiGeneration,
      SupportTicket,
    ]),
  ],
  controllers: [AiAssistantController],
  providers: [AiAssistantService],
  exports: [AiAssistantService],
})
export class AiAssistantModule {}
