import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { User } from '../auth/user.entity';
import { Order } from '../orders/order.entity';
import { Address } from '../addresses/address.entity';
import { Wishlist } from '../wishlist/wishlist.entity';
import { ProductReview } from '../products/review.entity';
import { AiConversation } from '../ai-assistant/entities/ai-conversation.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { DeletionRequest } from './deletion-request.entity';
import { GdprService } from './gdpr.service';
import { GdprController } from './gdpr.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      User, Order, Address, Wishlist, ProductReview, AiConversation, SupportTicket, DeletionRequest
    ]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        secret: config.get('jwt.secret') || process.env.JWT_SECRET,
        signOptions: { expiresIn: '1h' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [GdprService],
  controllers: [GdprController],
  exports: [GdprService],
})
export class GdprModule {}
