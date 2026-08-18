import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import { User } from '../auth/user.entity';
import { Order } from '../orders/order.entity';
import { Address } from '../addresses/address.entity';
import { Wishlist } from '../wishlist/wishlist.entity';
import { ProductReview } from '../products/review.entity';
import { AiConversation } from '../ai-assistant/entities/ai-conversation.entity';
import { SupportTicket } from '../support/support-ticket.entity';
import { DeletionRequest } from './deletion-request.entity';

@Injectable()
export class GdprService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Order)
    private orderRepository: Repository<Order>,
    @InjectRepository(Address)
    private addressRepository: Repository<Address>,
    @InjectRepository(Wishlist)
    private wishlistRepository: Repository<Wishlist>,
    @InjectRepository(ProductReview)
    private reviewRepository: Repository<ProductReview>,
    @InjectRepository(AiConversation)
    private aiConversationRepository: Repository<AiConversation>,
    @InjectRepository(SupportTicket)
    private ticketRepository: Repository<SupportTicket>,
    @InjectRepository(DeletionRequest)
    private deletionRequestRepository: Repository<DeletionRequest>,
    private jwtService: JwtService,
  ) {}

  async generateExportToken(userId: number): Promise<string> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }
    return this.jwtService.sign(
      { sub: userId, email: user.email },
      { expiresIn: '1h' },
    );
  }

  async getExportData(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const orders = await this.orderRepository.find({ where: { userId } });
    const addresses = await this.addressRepository.find({ where: { userId } });
    const wishlist = await this.wishlistRepository.find({ where: { userId } });
    const reviews = await this.reviewRepository.find({ where: { userId } });
    const conversations = await this.aiConversationRepository.find({
      where: { userId },
    });
    const tickets = await this.ticketRepository.find({ where: { userId } });

    return {
      profile: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        createdAt: user.createdAt,
      },
      orders,
      addresses,
      wishlist,
      reviews,
      conversations,
      tickets,
    };
  }

  async createDeletionRequest(userId: number) {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const existing = await this.deletionRequestRepository.findOne({
      where: { userId, status: 'pending' },
    });
    if (existing) {
      throw new BadRequestException(
        'An account deletion request is already pending for this user',
      );
    }

    const request = this.deletionRequestRepository.create({
      userId,
      email: user.email,
      status: 'pending',
    });
    await this.deletionRequestRepository.save(request);
    return request;
  }

  async cancelDeletionRequest(userId: number) {
    const existing = await this.deletionRequestRepository.findOne({
      where: { userId, status: 'pending' },
    });
    if (!existing) {
      throw new NotFoundException('No pending account deletion request found');
    }
    await this.deletionRequestRepository.remove(existing);
    return {
      success: true,
      message: 'Deletion request cancelled successfully',
    };
  }

  async getGdprStatus(userId: number) {
    const pendingDeletion = await this.deletionRequestRepository.findOne({
      where: { userId, status: 'pending' },
    });
    return {
      hasPendingDeletion: !!pendingDeletion,
      deletionRequest: pendingDeletion || null,
    };
  }

  formatAsCsv(data: any): string {
    let csv = '';

    // Profile
    csv += '=== USER PROFILE ===\n';
    csv += 'ID,Email,Name,Phone,Created At\n';
    csv += `"${data.profile.id}","${data.profile.email}","${data.profile.name}","${data.profile.phone || ''}","${data.profile.createdAt}"\n\n`;

    // Addresses
    csv += '=== ADDRESSES ===\n';
    csv += 'ID,Name,Phone,Address,City,State,Pincode\n';
    if (data.addresses && data.addresses.length > 0) {
      for (const addr of data.addresses) {
        csv += `"${addr.id}","${addr.name || ''}","${addr.phone || ''}","${(addr.address || '').replace(/"/g, '""')}","${addr.city || ''}","${addr.state || ''}","${addr.pincode || ''}"\n`;
      }
    } else {
      csv += 'No addresses found\n';
    }
    csv += '\n';

    // Orders
    csv += '=== ORDERS ===\n';
    csv +=
      'Order ID,Subtotal,Tax,Shipping,Total,Discount,Payment Method,Status,Created At\n';
    if (data.orders && data.orders.length > 0) {
      for (const order of data.orders) {
        csv += `"${order.id}","${order.subtotal}","${order.tax}","${order.shipping}","${order.total}","${order.discount}","${order.paymentMethod}","${order.status}","${order.createdAt}"\n`;
      }
    } else {
      csv += 'No orders found\n';
    }
    csv += '\n';

    // Wishlist
    csv += '=== WISHLIST ===\n';
    csv += 'ID,Product ID,Created At\n';
    if (data.wishlist && data.wishlist.length > 0) {
      for (const w of data.wishlist) {
        csv += `"${w.id}","${w.productId}","${w.createdAt}"\n`;
      }
    } else {
      csv += 'No wishlist items found\n';
    }
    csv += '\n';

    // Reviews
    csv += '=== PRODUCT REVIEWS ===\n';
    csv += 'Review ID,Product ID,Rating,Comment,Created At\n';
    if (data.reviews && data.reviews.length > 0) {
      for (const r of data.reviews) {
        csv += `"${r.id}","${r.productId}","${r.rating}","${(r.comment || '').replace(/"/g, '""')}","${r.createdAt}"\n`;
      }
    } else {
      csv += 'No reviews found\n';
    }
    csv += '\n';

    // Tickets
    csv += '=== SUPPORT TICKETS ===\n';
    csv += 'Ticket ID,Subject,Status,Priority,Created At\n';
    if (data.tickets && data.tickets.length > 0) {
      for (const t of data.tickets) {
        csv += `"${t.id}","${(t.subject || '').replace(/"/g, '""')}","${t.status}","${t.priority}","${t.createdAt}"\n`;
      }
    } else {
      csv += 'No support tickets found\n';
    }

    return csv;
  }
}
