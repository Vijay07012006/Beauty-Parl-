import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookSubscription, WebhookAttempt } from './entities/webhook.entity';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { OrderWebhookSubscriber, ProductWebhookSubscriber } from './webhook.subscriber';

@Module({
  imports: [
    TypeOrmModule.forFeature([WebhookSubscription, WebhookAttempt]),
  ],
  controllers: [WebhooksController],
  providers: [WebhooksService, OrderWebhookSubscriber, ProductWebhookSubscriber],
  exports: [WebhooksService],
})
export class WebhooksModule {}
