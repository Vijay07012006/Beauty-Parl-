import { EventSubscriber, EntitySubscriberInterface, InsertEvent, UpdateEvent } from 'typeorm';
import { Injectable } from '@nestjs/common';
import { Order } from '../orders/order.entity';
import { Product } from '../products/product.entity';
import { WebhooksService } from './webhooks.service';

@Injectable()
@EventSubscriber()
export class OrderWebhookSubscriber implements EntitySubscriberInterface<Order> {
  constructor(private readonly webhooksService: WebhooksService) {}

  listenTo() {
    return Order;
  }

  async afterInsert(event: InsertEvent<Order>) {
    await this.webhooksService.trigger('order.created', event.entity);
  }

  async afterUpdate(event: UpdateEvent<Order>) {
    if (
      event.entity &&
      event.entity.status === 'paid' &&
      event.databaseEntity &&
      event.databaseEntity.status !== 'paid'
    ) {
      await this.webhooksService.trigger('payment.received', event.entity);
    }
  }
}

@Injectable()
@EventSubscriber()
export class ProductWebhookSubscriber implements EntitySubscriberInterface<Product> {
  constructor(private readonly webhooksService: WebhooksService) {}

  listenTo() {
    return Product;
  }

  async afterUpdate(event: UpdateEvent<Product>) {
    if (
      event.entity &&
      event.entity.stock !== undefined &&
      event.entity.stock < 5 &&
      event.databaseEntity &&
      event.databaseEntity.stock >= 5
    ) {
      await this.webhooksService.trigger('inventory.low', event.entity);
    }
  }
}
