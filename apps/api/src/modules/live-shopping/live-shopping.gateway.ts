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

  private rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  private isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientId);
    if (!entry || entry.resetAt < now) {
      this.rateLimitMap.set(clientId, { count: 1, resetAt: now + 10_000 });
      return false;
    }
    entry.count += 1;
    return entry.count > 10; // max 10 chat messages per 10s (LS-2)
  }

  handleConnection(client: Socket) {
    const user = this.authenticate(client);
    if (!user) {
      client.disconnect(true);
      return;
    }
    client.data.user = user;
    console.log(
      `🔌 LiveShopping client connected: ${client.id} (role: ${user.role})`,
    );
  }

  handleDisconnect(client: Socket) {
    this.rateLimitMap.delete(client.id);
  }

  private authenticate(client: Socket): LiveUser | null {
    let token: string | undefined = client.handshake.auth?.token as
      string | undefined;
    if (!token) {
      const authHeader = client.handshake.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
    if (!token) {
      // HttpOnly cookie fallback (sent when socket.io connects with credentials)
      const cookieHeader = client.handshake.headers?.cookie;
      if (cookieHeader && typeof cookieHeader === 'string') {
        for (const part of cookieHeader.split(';')) {
          const pair = part.trim();
          if (pair.startsWith('bp_token=')) {
            token = pair.substring('bp_token='.length);
            break;
          }
        }
      }
    }
    // Token via query string is NOT accepted — avoids leakage in logs/referrers
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<{
        sub: number;
        email: string;
        role: string;
      }>(token);
      if (!payload?.sub) return null;
      return {
        id: Number(payload.sub),
        email: payload.email,
        role: payload.role,
      };
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
    if (typeof payload?.eventId !== 'string' || !payload.eventId) return;
    if (!/^[a-zA-Z0-9_-]{1,64}$/.test(payload.eventId)) return;
    client.join(`live:${payload.eventId}`);
    console.log(
      `🔌 Client ${client.id} joined live room live:${payload.eventId}`,
    );
  }

  @SubscribeMessage('send_live_chat')
  handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string; text: string },
  ) {
    const user: LiveUser | null = client.data.user;
    if (
      !user ||
      typeof payload?.eventId !== 'string' ||
      typeof payload?.text !== 'string'
    )
      return;
    const text = payload.text.trim();
    if (!payload.eventId || !text || text.length > 500) return;
    if (this.isRateLimited(client.id)) return;

    // Server-side identity (LS-1) — the chat name is derived from the verified
    // JWT email; the client cannot spoof who they are.
    const name = user.email?.split('@')[0]?.slice(0, 60) || 'Anonymous';

    this.server.to(`live:${payload.eventId}`).emit('live_chat_message', {
      name,
      text,
      time: new Date().toLocaleTimeString(),
    });
  }

  @SubscribeMessage('feature_product')
  handleFeatureProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      eventId: string;
      productId: number;
      name: string;
      price: number;
      image?: string;
    },
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
