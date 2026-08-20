import {
  EntitySubscriberInterface,
  EventSubscriber,
  UpdateEvent,
  InsertEvent,
  DataSource,
  MoreThan,
} from 'typeorm';
import { Injectable } from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Order } from '../orders/order.entity';
import { CreatorLookClick } from './creator-look-click.entity';
import { CreatorLook } from './creator-look.entity';
import { CommissionEarning } from './commission-earning.entity';

@EventSubscriber()
@Injectable()
export class OrderSubscriber implements EntitySubscriberInterface<Order> {
  constructor(
    @InjectDataSource() readonly dataSource: DataSource,
  ) {
    dataSource.subscribers.push(this);
  }

  listenTo() {
    return Order;
  }

  async afterUpdate(event: UpdateEvent<Order>) {
    if (event.entity && event.entity.status === 'paid') {
      const order = await event.manager.findOne(Order, {
        where: { id: event.entity.id },
      });
      if (order) {
        await this.processCommissions(event, order);
      }
    }
  }

  async afterInsert(event: InsertEvent<Order>) {
    if (event.entity && event.entity.paymentMethod === 'cod') {
      await this.processCommissions(event, event.entity);
    }
  }

  private async processCommissions(event: any, order: Order) {
    const manager = event.manager;
    const items = order.items || [];
    const visitorId = order.userId ? String(order.userId) : null;
    const guestEmail = order.guestEmail;

    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

    for (const item of items) {
      const productId = Number(item.productId);
      const quantity = Number(item.quantity) || 1;
      const price = Number(item.price);

      if (!productId) continue;

      let click: CreatorLookClick | null = null;

      if (visitorId) {
        click = await manager.findOne(CreatorLookClick, {
          where: {
            productId,
            userId: Number(visitorId),
            createdAt: MoreThan(thirtyDaysAgo),
          },
          order: { createdAt: 'DESC' },
        });
      }

      if (!click && guestEmail) {
        click = await manager.findOne(CreatorLookClick, {
          where: {
            productId,
            visitorId: guestEmail,
            createdAt: MoreThan(thirtyDaysAgo),
          },
          order: { createdAt: 'DESC' },
        });
      }

      if (click) {
        const look = await manager.findOne(CreatorLook, {
          where: { id: click.lookId },
        });
        if (look && look.userId !== order.userId) {
          const commissionAmount = price * quantity * 0.10;

          const commission = manager.create(CommissionEarning, {
            userId: look.userId,
            amount: Number(commissionAmount.toFixed(2)),
            sourceLookId: look.id,
            orderId: order.id,
            status: 'pending',
          });
          await manager.save(CommissionEarning, commission);
          console.log(`💰 [Commission] Awarded ${commissionAmount} to Creator ${look.userId} for Product ${productId} via Look ${look.id}`);
        }
      }
    }
  }
}
