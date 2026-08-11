import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import * as crypto from 'crypto';
import { AiChatService } from '../ai-chat/ai-chat.service';

const FAQ_BOT_ANSWERS = [
  {
    keywords: ['hi', 'hello', 'hey', 'start'],
    answer: "🌸 Welcome to **Beauty Parlé** Support! How can I help you today?\n\n1️⃣ **Track my order** 📦\n2️⃣ **Book a salon slot** 📅\n3️⃣ **Return & Refund policy** 💄\n4️⃣ **Talk to a human agent** 👩‍💼\n\nReply with a number or type your question!",
  },
  {
    keywords: ['track', 'order', 'status', 'delivery', '1'],
    answer: "📦 You can track your order live inside your **Orders** history page. Log in, click on your profile, and select 'My Orders' to view details, tracking links, and invoices.",
  },
  {
    keywords: ['book', 'booking', 'slot', 'appointment', 'salon', '2'],
    answer: "📅 Ready for a self-care day? Head over to our **Booking** tab in the main navigation. Select your services, pick a date, choose a stylist, and confirm your slot instantly!",
  },
  {
    keywords: ['return', 'refund', 'policy', 'cancel', '3'],
    answer: "💄 **Hassle-Free Returns**: We accept returns on unopened, unused products within 15 days. Contact support at `support@beautyparle.com` to initiate a refund.",
  },
  {
    keywords: ['human', 'agent', 'support', 'talk', 'chat', '4', 'person', 'representative'],
    answer: "👩‍💼 Escalling to a human support agent now! A representative has been notified and will reply shortly. Please type your detailed inquiry.",
  },
];

const ADMIN_ROOM = 'admins_room';

interface RoomState {
  guestEmail?: string;
  messages: any[];
  hasAdmin: boolean;
  adminResponded: boolean;
  pendingAiTimeout?: NodeJS.Timeout;
}

interface AuthedUser {
  id: number;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private activeRooms = new Map<string, RoomState>();

  constructor(
    private readonly aiChatService: AiChatService,
    private readonly jwtService: JwtService,
  ) {}

  // Simple per-socket token-bucket rate limiter for send_message (CHAT-3)
  private rateLimitMap = new Map<string, { count: number; resetAt: number }>();

  private isRateLimited(clientId: string): boolean {
    const now = Date.now();
    const entry = this.rateLimitMap.get(clientId);
    if (!entry || entry.resetAt < now) {
      this.rateLimitMap.set(clientId, { count: 1, resetAt: now + 10_000 });
      return false;
    }
    entry.count += 1;
    return entry.count > 10; // max 10 messages per 10s
  }

  handleConnection(client: Socket) {
    const user = this.authenticate(client);
    if (!user) {
      // Guests get a SERVER-ISSUED random room id — a client cannot pick/impersonate
      // another guest's room (CHAT-2)
      const guestId = `guest_${crypto.randomBytes(12).toString('hex')}`;
      client.data.user = null;
      client.data.guestId = guestId;
      client.data.roomId = guestId;
      // Tell the guest which room the server assigned so it can join its own room
      client.emit('assigned_room', guestId);
      console.log(`🔌 Guest client connected: ${client.id} (server-assigned room ${guestId})`);
      return;
    }
    client.data.user = user;
    // Authenticated customers are bound to their own room id server-side (CHAT-1)
    client.data.roomId = `user_${user.id}`;
    client.join(`user_${user.id}`);
    if (this.isAdminUser(user)) {
      client.join(ADMIN_ROOM);
    }
    console.log(`🔌 Authenticated client connected: ${client.id} (role: ${user.role})`);
  }

  handleDisconnect(client: Socket) {
    // Best-effort cleanup of rate-limit state for the socket
    this.rateLimitMap.delete(client.id);
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  private authenticate(client: Socket): AuthedUser | null {
    let token: string | undefined = client.handshake.auth?.token as string | undefined;
    if (!token) {
      const authHeader = client.handshake.headers?.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.slice(7);
      }
    }
    // Token via query string is NOT accepted — avoids leakage in logs/referrers (M7)
    if (!token) return null;
    try {
      const payload = this.jwtService.verify<{ sub: number; email: string; role: string }>(token);
      if (!payload?.sub) return null;
      return { id: Number(payload.sub), email: payload.email, role: payload.role };
    } catch {
      return null;
    }
  }

  private isAdminUser(user: AuthedUser): boolean {
    return user.role === 'admin' || user.role === 'super_admin';
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const user: AuthedUser | null = client.data.user;
    const { roomId } = payload || {};
    if (typeof roomId !== 'string' || !roomId) return;

    const isAdmin = !!user && this.isAdminUser(user);

    // Non-admins may ONLY join their server-assigned room (CHAT-1) —
    // guests get their generated id, authed users get `user_<id>`. Cross-room
    // joins are rejected, closing the room-hopping/spoofing hole.
    const allowedRoom = client.data.roomId as string;
    if (!isAdmin) {
      if (roomId !== allowedRoom) return;
    }

    client.join(roomId);
    console.log(`👥 Client ${client.id} joined room: ${roomId} (admin: ${isAdmin})`);

    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.set(roomId, {
        guestEmail: user && !isAdmin ? user.email : undefined,
        messages: [],
        hasAdmin: isAdmin,
        adminResponded: false,
      });
    } else if (isAdmin) {
      const room = this.activeRooms.get(roomId)!;
      room.hasAdmin = true;
    }

    const room = this.activeRooms.get(roomId);
    if (room && room.messages.length > 0) {
      client.emit('message_history', room.messages);
    } else {
      const initialGreeting = {
        id: 'welcome_' + Date.now(),
        senderId: 'beauty_bot',
        senderName: 'Beauty Assistant',
        content: FAQ_BOT_ANSWERS[0].answer,
        isAdmin: true,
        createdAt: new Date(),
      };
      room?.messages.push(initialGreeting);
      client.emit('receive_message', initialGreeting);
    }

    this.broadcastActiveRooms();
  }

  @SubscribeMessage('send_message')
  async handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      content: string;
    },
  ) {
    const user: AuthedUser | null = client.data.user;
    const { roomId, content } = payload || {};
    if (typeof roomId !== 'string' || typeof content !== 'string') return;
    const trimmed = content.trim();
    if (!roomId || !trimmed) return;

    // Content bound so a single message cannot bloat memory (CHAT-3)
    if (trimmed.length > 1000) return;

    // Per-socket token bucket rate limit (CHAT-3)
    if (this.isRateLimited(client.id)) return;

    const isAdmin = !!user && this.isAdminUser(user);

    // Non-admins may only send to their own server-assigned room (CHAT-1)
    const allowedRoom = client.data.roomId as string;
    if (!isAdmin && roomId !== allowedRoom) return;

    const senderId = user ? String(user.id) : (client.data.guestId as string) || 'guest';
    const senderName = user
      ? isAdmin
        ? 'Support Agent'
        : (user.email?.split('@')[0] || 'Customer')
      : 'Guest';

    const message = {
      id: 'msg_' + Date.now(),
      senderId,
      senderName,
      content: trimmed,
      isAdmin,
      createdAt: new Date(),
    };

    const room = this.activeRooms.get(roomId);
    if (room) {
      room.messages.push(message);

      if (isAdmin) {
        room.hasAdmin = true;
        room.adminResponded = true;
        if (room.pendingAiTimeout) {
          clearTimeout(room.pendingAiTimeout);
          room.pendingAiTimeout = undefined;
        }
      }
    }

    this.server.to(roomId).emit('receive_message', message);

    if (!isAdmin) {
      const lowerContent = trimmed.toLowerCase();
      let answerFound = false;

      for (const faq of FAQ_BOT_ANSWERS) {
        if (faq.keywords.some((keyword) => lowerContent.includes(keyword))) {
          const botMessage = {
            id: 'bot_' + Date.now(),
            senderId: 'beauty_bot',
            senderName: 'Beauty Assistant',
            content: faq.answer,
            isAdmin: true,
            createdAt: new Date(),
          };

          setTimeout(() => {
            if (room) room.messages.push(botMessage);
            this.server.to(roomId).emit('receive_message', botMessage);
          }, 1000);

          answerFound = true;
          break;
        }
      }

      if (!answerFound) {
        if (room?.hasAdmin) {
          if (room.pendingAiTimeout) {
            clearTimeout(room.pendingAiTimeout);
          }
          room.adminResponded = false;
          room.pendingAiTimeout = setTimeout(() => {
            if (!room.adminResponded) {
              this.sendAiReply(roomId, trimmed, senderId);
            }
          }, 2000);
        } else {
          this.sendAiReply(roomId, trimmed, senderId);
        }
      }
    }

    this.broadcastActiveRooms();
  }

  private async sendAiReply(roomId: string, content: string, senderId?: string) {
    const room = this.activeRooms.get(roomId);
    if (!room) return;

    try {
      const { reply, modelUsed } = await this.aiChatService.sendMessage(
        content,
        senderId,
        roomId,
      );

      const botMessage = {
        id: 'ai_bot_' + Date.now(),
        senderId: 'beauty_bot',
        senderName: 'Beauty Assistant',
        content: reply,
        isAdmin: true,
        modelUsed,
        createdAt: new Date(),
      };

      if (room && !room.adminResponded) {
        room.messages.push(botMessage);
        this.server.to(roomId).emit('receive_message', botMessage);
      }
    } catch (err) {
      console.warn('AI chat reply failed:', (err as any)?.message || err);
      const fallbackMessage = {
        id: 'bot_fallback_' + Date.now(),
        senderId: 'beauty_bot',
        senderName: 'Beauty Assistant',
        content: "Sorry, I didn't quite catch that. Type **4** or **agent** to escalate this conversation to a human support agent!",
        isAdmin: true,
        createdAt: new Date(),
      };
      if (room) {
        room.messages.push(fallbackMessage);
        this.server.to(roomId).emit('receive_message', fallbackMessage);
      }
    }
  }

  @SubscribeMessage('get_active_rooms')
  handleGetActiveRooms(@ConnectedSocket() client: Socket) {
    const user: AuthedUser = client.data.user;
    if (!user || !this.isAdminUser(user)) return;
    client.emit('active_rooms_list', this.buildActiveRoomsList());
  }

  private buildActiveRoomsList() {
    return Array.from(this.activeRooms.entries()).map(([roomId, data]) => ({
      roomId,
      guestEmail: data.guestEmail,
      lastMessage: data.messages[data.messages.length - 1],
      hasAdmin: data.hasAdmin,
    }));
  }

  private broadcastActiveRooms() {
    // Only admins may see the list of active rooms + guest emails (prevents data leak)
    this.server.to(ADMIN_ROOM).emit('active_rooms_list', this.buildActiveRoomsList());
  }
}
