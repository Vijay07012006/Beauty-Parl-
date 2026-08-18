import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order } from './order.entity';
import { SupportGateway } from '../support/support.gateway';
import { EmailService } from '../email/email.service';
import { WhatsappService } from '../notifications/whatsapp.service';

@Injectable()
export class TrackingService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    private readonly supportGateway: SupportGateway,
    private readonly emailService: EmailService,
    private readonly whatsappService: WhatsappService,
  ) {}

  async updateTracking(
    orderId: number,
    latitude: number,
    longitude: number,
    status?: string,
  ): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    order.trackingLatitude = latitude;
    order.trackingLongitude = longitude;

    const currentStatus = status || order.status;
    const history = order.trackingHistory || [];
    history.push({
      status: currentStatus,
      description: `Location update: Latitude ${latitude}, Longitude ${longitude}`,
      timestamp: new Date(),
      latitude,
      longitude,
    });
    order.trackingHistory = history;

    if (
      status &&
      ['pending', 'processing', 'shipped', 'delivered', 'cancelled'].includes(
        status,
      )
    ) {
      order.status = status as any;

      // Try sending status update email
      if (order.guestEmail) {
        await this.emailService
          .sendOrderStatusEmail(order.guestEmail, order.id, status)
          .catch(() => {});
      } else if (order.userId) {
        // Fetch user email
        const userRepo = this.orderRepo.manager.getRepository('User');
        const user = await userRepo.findOne({ where: { id: order.userId } });
        if (user && (user as any).email) {
          await this.emailService
            .sendOrderStatusEmail((user as any).email, order.id, status)
            .catch(() => {});
          // Send WhatsApp update if user phone is saved
          if ((user as any).phone) {
            await this.whatsappService
              .sendOrderStatusUpdate((user as any).phone, order.id, status)
              .catch(() => {});
          }
        }
      }
    }

    await this.orderRepo.save(order);

    // Broadcast tracking update to websocket clients
    const updatePayload = {
      orderId: order.id,
      status: order.status,
      latitude: order.trackingLatitude,
      longitude: order.trackingLongitude,
      history: order.trackingHistory,
    };
    this.supportGateway.notifyTrackingUpdate(order.id, updatePayload);

    return updatePayload;
  }

  async getTracking(orderId: number): Promise<any> {
    const order = await this.orderRepo.findOne({ where: { id: orderId } });
    if (!order) {
      throw new NotFoundException(`Order with ID ${orderId} not found`);
    }

    return {
      orderId: order.id,
      status: order.status,
      latitude: order.trackingLatitude ? Number(order.trackingLatitude) : null,
      longitude: order.trackingLongitude
        ? Number(order.trackingLongitude)
        : null,
      history: order.trackingHistory || [],
    };
  }
}
