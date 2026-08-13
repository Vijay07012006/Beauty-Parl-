import { Injectable, Inject, forwardRef } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In } from 'typeorm';
import { SupportTicket } from './support-ticket.entity';
import { TicketReply } from './ticket-reply.entity';
import { Notification } from './notification.entity';
import { User } from '../auth/user.entity';
import { EmailService } from '../email/email.service';
import { SupportGateway } from './support.gateway';

@Injectable()
export class SupportService {
  constructor(
    @InjectRepository(SupportTicket)
    private ticketRepo: Repository<SupportTicket>,
    @InjectRepository(TicketReply)
    private replyRepo: Repository<TicketReply>,
    @InjectRepository(Notification)
    private notificationRepo: Repository<Notification>,
    @InjectRepository(User)
    private userRepo: Repository<User>,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
    private supportGateway: SupportGateway,
  ) {}

  async createTicket(user: any, data: { subject: string; message: string; orderId?: number }) {
    const isRegistered = user && user.id;

    // Create ticket
    const ticket = this.ticketRepo.create({
      userId: isRegistered ? user.id : null,
      guestEmail: isRegistered ? user.email : 'guest@beautyparle.com',
      subject: data.subject,
      message: data.message,
      orderId: data.orderId || null,
      status: 'open',
      priority: 'medium',
    });
    
    const savedTicket = await this.ticketRepo.save(ticket);
    const targetEmail = isRegistered ? user.email : 'guest@beautyparle.com';
    const userName = isRegistered ? user.name : 'Guest';

    // 1. Send confirmation email to user
    try {
      await this.emailService.sendTicketConfirmation(
        targetEmail,
        savedTicket.id,
        data.subject,
        data.message,
      );
    } catch (err: any) {
      console.error('Failed to send ticket confirmation email:', err.message);
    }

    // 2. Send alert email to admins
    try {
      await this.emailService.sendTicketAdminAlert(
        savedTicket.id,
        userName,
        data.subject,
        data.message,
      );
    } catch (err: any) {
      console.error('Failed to send admin alert email:', err.message);
    }

    // 3. Real-time notification for admins (WebSocket)
    try {
      await this.supportGateway.notifyNewTicket({
        ticketId: savedTicket.id,
        userName,
        subject: data.subject,
      });
    } catch (err: any) {
      console.error('WebSocket notifyNewTicket failed:', err.message);
    }

    // 4. Save notification in DB for admins
    try {
      const admins = await this.userRepo.find({
        where: { role: In(['admin', 'super_admin']) },
      });
      for (const admin of admins) {
        const notif = this.notificationRepo.create({
          userId: admin.id,
          type: 'new_ticket',
          title: `New Ticket #${savedTicket.id}`,
          message: `User ${userName} raised a ticket: ${data.subject}`,
          link: `/en/admin/tickets`,
          isRead: false,
        });
        await this.notificationRepo.save(notif);
      }
    } catch (err: any) {
      console.error('Failed to persist admin notification:', err.message);
    }

    return savedTicket;
  }

  async getTickets(status?: string) {
    const query: any = {};
    if (status) {
      query.status = status;
    }
    return this.ticketRepo.find({
      where: query,
      order: { createdAt: 'DESC' },
    });
  }

  async getTicketDetails(id: number) {
    const ticket = await this.ticketRepo.findOne({ where: { id } });
    if (!ticket) throw new Error('Ticket not found');
    const replies = await this.replyRepo.find({
      where: { ticketId: id },
      order: { createdAt: 'ASC' },
    });
    return { ticket, replies };
  }

  async addReply(ticketId: number, user: any, message: string, isAdmin: boolean) {
    const reply = this.replyRepo.create({
      ticketId,
      userId: user?.id || null,
      isAdmin,
      message,
    });
    await this.replyRepo.save(reply);

    // If admin replies, notify user or update ticket status
    if (isAdmin) {
      await this.ticketRepo.update(ticketId, { status: 'in_progress' });
      await this.supportGateway.notifyTicketUpdate(ticketId, 'in_progress');
    }
    return reply;
  }

  async resolveTicket(ticketId: number, adminId: number) {
    const ticket = await this.ticketRepo.findOne({ where: { id: ticketId } });
    if (!ticket) throw new Error('Ticket not found');
    
    ticket.status = 'resolved';
    ticket.resolvedAt = new Date();
    ticket.assignedTo = adminId;
    await this.ticketRepo.save(ticket);

    await this.supportGateway.notifyTicketUpdate(ticketId, 'resolved');

    // Notify user via email
    let userEmail = ticket.guestEmail;
    if (ticket.userId) {
      const u = await this.userRepo.findOne({ where: { id: ticket.userId } });
      if (u) {
        userEmail = u.email;
      }
    }

    if (userEmail) {
      try {
        await this.emailService.sendTicketResolvedEmail(userEmail, ticket.id);
      } catch (err: any) {
        console.error('Failed to send ticket resolution email:', err.message);
      }
    }

    return ticket;
  }

  async getNotifications(adminId: number) {
    return this.notificationRepo.find({
      where: { userId: adminId },
      order: { createdAt: 'DESC' },
      take: 15,
    });
  }

  async markNotificationsRead(adminId: number) {
    await this.notificationRepo.update({ userId: adminId }, { isRead: true });
    return { success: true };
  }
}
