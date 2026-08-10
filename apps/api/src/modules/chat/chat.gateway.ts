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

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server!: Server;

  private activeRooms = new Map<string, { guestEmail?: string; messages: any[] }>();

  handleConnection(client: Socket) {
    console.log(`🔌 Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`❌ Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; guestEmail?: string },
  ) {
    const { roomId, guestEmail } = payload;
    client.join(roomId);
    console.log(`👥 Client ${client.id} joined room: ${roomId}`);

    if (!this.activeRooms.has(roomId)) {
      this.activeRooms.set(roomId, {
        guestEmail,
        messages: [],
      });
    }

    // Restore message history
    const room = this.activeRooms.get(roomId);
    if (room && room.messages.length > 0) {
      client.emit('message_history', room.messages);
    } else {
      // Welcome new user with greeting message from chatbot
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

    // Broadcast room update to admin channels
    this.broadcastActiveRooms();
  }

  @SubscribeMessage('send_message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody()
    payload: {
      roomId: string;
      content: string;
      senderId: string;
      senderName: string;
      isAdmin: boolean;
    },
  ) {
    const { roomId, content, senderId, senderName, isAdmin } = payload;
    const message = {
      id: 'msg_' + Date.now(),
      senderId,
      senderName,
      content,
      isAdmin,
      createdAt: new Date(),
    };

    const room = this.activeRooms.get(roomId);
    if (room) {
      room.messages.push(message);
    }

    // Broadcast user message to room (client & listening agents)
    this.server.to(roomId).emit('receive_message', message);

    // Trigger FAQ Chatbot if user messaged (not admin)
    if (!isAdmin) {
      const lowerContent = content.toLowerCase().trim();
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

          // Delay bot response slightly to feel natural
          setTimeout(() => {
            if (room) room.messages.push(botMessage);
            this.server.to(roomId).emit('receive_message', botMessage);
          }, 1000);

          answerFound = true;
          break;
        }
      }

      if (!answerFound) {
        // Default chatbot response
        const fallbackMessage = {
          id: 'bot_fallback_' + Date.now(),
          senderId: 'beauty_bot',
          senderName: 'Beauty Assistant',
          content: "Sorry, I didn't quite catch that. Type **4** or **agent** to escalate this conversation to a human support agent!",
          isAdmin: true,
          createdAt: new Date(),
        };

        setTimeout(() => {
          if (room) room.messages.push(fallbackMessage);
          this.server.to(roomId).emit('receive_message', fallbackMessage);
        }, 1000);
      }
    }

    // Broadcast room update to admin channels
    this.broadcastActiveRooms();
  }

  @SubscribeMessage('get_active_rooms')
  handleGetActiveRooms(@ConnectedSocket() client: Socket) {
    const list = Array.from(this.activeRooms.entries()).map(([roomId, data]) => ({
      roomId,
      guestEmail: data.guestEmail,
      lastMessage: data.messages[data.messages.length - 1],
    }));
    client.emit('active_rooms_list', list);
  }

  private broadcastActiveRooms() {
    const list = Array.from(this.activeRooms.entries()).map(([roomId, data]) => ({
      roomId,
      guestEmail: data.guestEmail,
      lastMessage: data.messages[data.messages.length - 1],
    }));
    this.server.emit('active_rooms_list', list);
  }
}
