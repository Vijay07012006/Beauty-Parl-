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
import { CoShoppingService } from './co-shopping.service';

interface UserPayload {
  id: number;
  email: string;
  role: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class CoShoppingGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly coShoppingService: CoShoppingService,
    private readonly jwtService: JwtService,
  ) {}

  private authenticate(client: Socket): UserPayload | null {
    let token: string | undefined = client.handshake.auth?.token as string | undefined;
    if (!token && client.handshake.headers?.cookie) {
      const cookies = client.handshake.headers.cookie.split(';');
      const tokenCookie = cookies.find((c) => c.trim().startsWith('bp_token='));
      if (tokenCookie) {
        token = tokenCookie.split('=')[1].trim();
      }
    }
    if (!token) return null;
    try {
      const decoded = this.jwtService.verify(token);
      return {
        id: decoded.sub,
        email: decoded.email,
        role: decoded.role,
      };
    } catch {
      return null;
    }
  }

  handleConnection(client: Socket) {
    const user = this.authenticate(client);
    if (!user) {
      client.data.user = null;
    } else {
      client.data.user = user;
    }
  }

  handleDisconnect(client: Socket) {
    const roomId = client.data.roomId;
    if (roomId) {
      this.coShoppingService.leaveRoom(roomId, client.id).then((updatedRoom) => {
        this.server.to(roomId).emit('room:state', updatedRoom);
      }).catch(() => {});
    }
  }

  @SubscribeMessage('room:join')
  async handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; name: string },
  ) {
    const user = client.data.user as UserPayload | null;
    const userId = user?.id || Math.floor(Math.random() * 1000000) + 1000000;
    const name = data.name || user?.email?.split('@')[0] || `Guest_${userId}`;

    client.data.roomId = data.roomId;
    client.data.userId = userId;
    client.data.name = name;

    client.join(data.roomId);
    const updatedRoom = await this.coShoppingService.joinRoom(data.roomId, userId, name, client.id);
    this.server.to(data.roomId).emit('room:state', updatedRoom);
  }

  @SubscribeMessage('room:leave')
  async handleLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string },
  ) {
    client.leave(data.roomId);
    const updatedRoom = await this.coShoppingService.leaveRoom(data.roomId, client.id);
    client.data.roomId = null;
    this.server.to(data.roomId).emit('room:state', updatedRoom);
  }

  @SubscribeMessage('room:add-item')
  async handleAddItem(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; productId: number; quantity: number },
  ) {
    const userId = client.data.userId;
    const updatedRoom = await this.coShoppingService.addItem(
      data.roomId,
      data.productId,
      data.quantity,
      userId,
    );
    this.server.to(data.roomId).emit('room:state', updatedRoom);
  }

  @SubscribeMessage('room:remove-item')
  async handleRemoveItem(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; productId: number; quantity: number },
  ) {
    const userId = client.data.userId;
    const updatedRoom = await this.coShoppingService.removeItem(
      data.roomId,
      data.productId,
      data.quantity,
      userId,
    );
    this.server.to(data.roomId).emit('room:state', updatedRoom);
  }

  @SubscribeMessage('webrtc:signal')
  handleWebRtcSignal(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { roomId: string; targetSocketId: string; signal: any },
  ) {
    this.server.to(data.targetSocketId).emit('webrtc:signal', {
      senderSocketId: client.id,
      senderUserId: client.data.userId,
      senderName: client.data.name,
      signal: data.signal,
    });
  }
}
