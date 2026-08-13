import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SupportTicket } from './support-ticket.entity';
import { TicketReply } from './ticket-reply.entity';
import { Notification } from './notification.entity';
import { User } from '../auth/user.entity';
import { SupportService } from './support.service';
import { SupportController } from './support.controller';
import { SupportGateway } from './support.gateway';
import { EmailModule } from '../email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([SupportTicket, TicketReply, Notification, User]),
    forwardRef(() => EmailModule),
  ],
  controllers: [SupportController],
  providers: [SupportService, SupportGateway],
  exports: [SupportService, SupportGateway],
})
export class SupportModule {}
