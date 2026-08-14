import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class SupportGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  handleConnection(client: Socket) {
    console.log(`🔌 Support Client Connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`🔌 Support Client Disconnected: ${client.id}`);
  }

  async notifyNewTicket(data: { ticketId: number; userName: string; subject: string }) {
    if (this.server) {
      this.server.emit('new_ticket', {
        ticketId: data.ticketId,
        userName: data.userName,
        subject: data.subject,
        timestamp: new Date().toISOString(),
      });
    }
  }

  async notifyTicketUpdate(ticketId: number, status: string) {
    if (this.server) {
      this.server.emit('ticket_update', { ticketId, status });
    }
  }

  async notifyTrackingUpdate(orderId: number, data: any) {
    if (this.server) {
      this.server.emit(`order_tracking_${orderId}`, data);
      this.server.emit('order_tracking', { orderId, ...data });
    }
  }
}
