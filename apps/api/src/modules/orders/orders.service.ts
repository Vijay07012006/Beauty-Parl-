import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { User } from '../auth/user.entity';
import { EmailService } from '../email/email.service';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private orderRepo: Repository<Order>,
    private emailService: EmailService,
  ) {}

  async create(orderData: Partial<Order>): Promise<Order> {
    const order = this.orderRepo.create(orderData);
    const saved = await this.orderRepo.save(order);

    // Send order confirmation
    const email = orderData.guestEmail || (orderData.userId ? await this.getUserEmail(orderData.userId) : null);
    if (email) {
      try {
        await this.emailService.sendOrderConfirmation(email, saved.id, Number(saved.total), saved.items);
      } catch (err) {
        console.error('Failed to send order confirmation email:', err);
      }
    }

    return saved;
  }

  async findAll(): Promise<Order[]> {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: number): Promise<Order | null> {
    return this.orderRepo.findOne({ where: { id } });
  }

  async update(id: number, data: Partial<Order>): Promise<Order | null> {
    const originalOrder = await this.findOne(id);
    await this.orderRepo.update(id, data);
    const updated = await this.findOne(id);

    if (updated && data.status && originalOrder?.status !== data.status) {
      const email = updated.guestEmail || (updated.userId ? await this.getUserEmail(updated.userId) : null);
      if (email) {
        try {
          await this.emailService.sendOrderStatusEmail(email, updated.id, data.status);
        } catch (err) {
          console.error('Failed to send order status update email:', err);
        }
      }
    }

    return updated;
  }

  private async getUserEmail(userId: number): Promise<string | null> {
    if (!userId) return null;
    const userRepo = this.orderRepo.manager.getRepository(User);
    const user = await userRepo.findOne({ where: { id: userId } });
    return user?.email || null;
  }
}
