import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class LiveShoppingGateway {
  @WebSocketServer()
  server!: Server;

  @SubscribeMessage('join_live_event')
  handleJoinEvent(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string },
  ) {
    client.join(`live:${payload.eventId}`);
    console.log(`🔌 Client ${client.id} joined live room live:${payload.eventId}`);
  }

  @SubscribeMessage('send_live_chat')
  handleSendChat(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string; name: string; text: string },
  ) {
    this.server.to(`live:${payload.eventId}`).emit('live_chat_message', {
      name: payload.name,
      text: payload.text,
      time: new Date().toLocaleTimeString(),
    });
  }

  @SubscribeMessage('feature_product')
  handleFeatureProduct(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { eventId: string; productId: number; name: string; price: number; image?: string },
  ) {
    this.server.to(`live:${payload.eventId}`).emit('product_featured_alert', {
      productId: payload.productId,
      name: payload.name,
      price: payload.price,
      image: payload.image,
    });
  }
}
