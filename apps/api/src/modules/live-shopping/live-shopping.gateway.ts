import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

interface LiveUser {
  id: number;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveShoppingGateway implements OnGatewayConnection {
  @WebSocketServer()
  server!: Server;

  constructor(private readonly jwtService: JwtService) {}

  handleConnection(client: Socket) {
    const user = this.authenticate(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    console.log(`🔌 LiveShopping client connected: ${client.id} (role: ${user.role})`);
  }

  private authenticate(client: Socket): LiveUser | null {
    let token: string | undefined =
      client.handshake.auth?.token ||
      (client.handshake.query?.token as string) ||
      undefined;
    if (!token) {
      const authHeader = client.handshake.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<{ sub: number; email: string; role: string }>(token);
      if (!payload?.sub) return null;
      return { id: Number(payload.sub), email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  }

  private isAdmin(user: LiveUser | null): boolean {
    return !!user && (user.role === 'admin' || user.role === 'super_admin');
  }

  @SubscribeMessage('join_live_event')
  handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string },
  ) {
    if (!client.data.user) return;
    if (!payload?.eventId) return;
    client.join(`live:${payload.eventId}`);
    console.log(`🔌 Client ${client.id} joined live room live:${payload.eventId}`);
  }

  @SubscribeMessage('send_live_chat')
  handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string; name: string; text: string },
  ) {
    const user: LiveUser | null = client.data.user;
    if (!user || !payload?.eventId || !payload?.text) return;
    if (typeof payload.text !== 'string' || payload.text.length > 500) return;

    // Server-side identity — never trust the client-provided name/role
    this.server.to(`live:${payload.eventId}`).emit('live_chat_message', {
      name: (payload.name && typeof payload.name === 'string' ? payload.name : 'Anonymous').slice(0, 60),
      text: payload.text,
      time: new Date().toLocaleTimeString(),
    });
  }

  @SubscribeMessage('feature_product')
  handleFeatureProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string; productId: number; name: string; price: number; image?: string },
  ) {
    const user: LiveUser | null = client.data.user;
    if (!this.isAdmin(user)) return; // Admin-only server-side
    if (!payload?.eventId || !payload?.productId) return;
    this.server.to(`live:${payload.eventId}`).emit('product_featured_alert', {
      productId: payload.productId,
      name: payload.name,
      price: payload.price,
      image: payload.image,
    });
  }
}
