import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { Product } from '../products/product.entity';
import { User } from '../auth/user.entity';
import { Notification } from '../support/notification.entity';
import { EmailService } from '../email/email.service';
import { SupportGateway } from '../support/support.gateway';

@Injectable()
export class InventoryAlertService {
  constructor(
    @InjectRepository(Product)
    private productRepo: Repository<Product>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    private emailService: EmailService,
    private supportGateway: SupportGateway,
  ) {}

  async getLowStockProducts(): Promise<Product[]> {
    return this.productRepo.find({
      where: {
        stock: In([0, 1, 2, 3, 4, 5, 6, 7, 8, 9]), // stock < 10
      },
      order: { stock: 'ASC' },
    });
  }

  async checkAndAlert(productId: number, newStock: number): Promise<void> {
    if (newStock >= 10) return;

    const product = await this.productRepo.findOne({
      where: { id: productId },
    });
    if (!product) return;

    // 1. Broadcast real-time WebSocket warning to administrative dashboards
    if (this.supportGateway && this.supportGateway.server) {
      this.supportGateway.server.emit('low_stock', {
        productId,
        name: product.name,
        stock: newStock,
        timestamp: new Date().toISOString(),
      });
    }

    // 2. Fetch all administrators to alert
    const admins = await this.userRepo.find({
      where: { role: In(['admin', 'super_admin']) },
    });

    for (const admin of admins) {
      // 3. Save database notification for notification center
      try {
        const notif = this.notificationRepo.create({
          userId: admin.id,
          type: 'low_stock',
          title: `🚨 Low Stock Alert`,
          message: `Product "${product.name}" stock dropped to ${newStock} units.`,
          link: `/en/admin/inventory`,
          isRead: false,
        });
        await this.notificationRepo.save(notif);
      } catch (err: any) {
        console.error(
          `Failed to save low stock notification for Admin #${admin.id}:`,
          err.message,
        );
      }

      // 4. Send Brevo SMTP email warning
      if (admin.email) {
        try {
          await this.emailService.sendInventoryAlertEmail(
            admin.email,
            product.name,
            newStock,
          );
        } catch (emailErr: any) {
          console.error(
            `Failed to email stock alert to ${admin.email}:`,
            emailErr.message,
          );
        }
      }
    }
  }
}
