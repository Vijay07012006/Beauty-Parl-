'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Send, User, MessageCircle } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';

interface ActiveRoom {
  roomId: string;
  guestEmail?: string;
  lastMessage?: {
    content: string;
    createdAt: string;
  };
}

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
}

export default function AdminChatPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const [socket, setSocket] = useState<Socket | null>(null);
  const [activeRooms, setActiveRooms] = useState<ActiveRoom[]>([]);
  const [selectedRoomId, setSelectedRoomId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isAdminUser, setIsAdminUser] = useState(false);
  const [loading, setLoading] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Check if user is admin
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        if (parsed.role === 'admin' || parsed.role === 'super_admin') {
          setIsAdminUser(true);
        } else {
          router.push(`/${locale}/auth/login`);
        }
      } catch {
        router.push(`/${locale}/auth/login`);
      }
    } else {
      router.push(`/${locale}/auth/login`);
    }
    setLoading(false);
  }, [router, locale]);

  useEffect(() => {
    if (!isAdminUser) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';
    const token = localStorage.getItem('token');
    const newSocket = io(baseUrl, {
      auth: { token: token || undefined },
    });
    setSocket(newSocket);

    // Get active rooms list
    newSocket.emit('get_active_rooms');

    newSocket.on('active_rooms_list', (list: ActiveRoom[]) => {
      setActiveRooms(list);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isAdminUser]);

  useEffect(() => {
    if (!socket || !selectedRoomId) return;

    // Join the selected customer's room
    socket.emit('join_room', { roomId: selectedRoomId });

    // Listen for room updates
    socket.on('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    socket.on('message_history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    return () => {
      socket.off('receive_message');
      socket.off('message_history');
    };
  }, [socket, selectedRoomId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !selectedRoomId) return;

    socket.emit('send_message', {
      roomId: selectedRoomId,
      content: input.trim(),
      senderId: 'admin_agent',
      senderName: 'Beauty Support Agent',
      isAdmin: true,
    });

    setInput('');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  if (!isAdminUser) return null;

  return (
    <>
      <Header />
      <main className="min-h-[85vh] bg-secondary/10 py-8">
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-3xl font-playfair font-bold mb-6 text-foreground">Support Chat Center</h1>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 bg-card border border-border/40 rounded-3xl overflow-hidden min-h-[600px] shadow-sm">
            {/* Rooms List Pane */}
            <div className="md:col-span-1 border-r border-border/30 p-4 space-y-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Active Discussions ({activeRooms.length})
              </h2>
              {activeRooms.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <MessageCircle className="w-8 h-8 text-muted-foreground/50 mb-2" />
                  <p className="text-xs text-muted-foreground">No active conversations</p>
                </div>
              ) : (
                <div className="space-y-2 overflow-y-auto max-h-[500px]">
                  {activeRooms.map((room) => {
                    const isSelected = room.roomId === selectedRoomId;
                    return (
                      <button
                        key={room.roomId}
                        onClick={() => {
                          setSelectedRoomId(room.roomId);
                          setMessages([]);
                        }}
                        className={`w-full text-left p-3.5 rounded-2xl border transition-all cursor-pointer flex items-center gap-3 ${
                          isSelected
                            ? 'bg-primary/5 border-primary text-foreground ring-2 ring-primary/10'
                            : 'bg-card border-border/30 hover:border-primary/50 text-foreground'
                        }`}
                      >
                        <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center font-bold">
                          {room.roomId.startsWith('guest_') ? '👤' : '👑'}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-xs truncate">
                            {room.roomId.startsWith('guest_') ? `Guest (${room.roomId.substring(6, 11)})` : 'Member Client'}
                          </h4>
                          <p className="text-[11px] text-muted-foreground truncate">
                            {room.lastMessage?.content || 'No messages yet'}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Conversation Window Pane */}
            <div className="md:col-span-2 flex flex-col min-h-[600px]">
              {selectedRoomId ? (
                <>
                  {/* Conversation Header */}
                  <div className="p-4 bg-secondary/20 border-b border-border/30 flex items-center justify-between">
                    <h3 className="font-bold text-sm text-foreground">
                      Managing room: <span className="font-mono text-xs text-primary">{selectedRoomId}</span>
                    </h3>
                  </div>

                  {/* Message History */}
                  <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-secondary/5">
                    {messages.map((msg) => {
                      const isMe = msg.isAdmin;
                      return (
                        <div
                          key={msg.id}
                          className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-2xl p-3.5 text-sm shadow-sm ${
                              isMe
                                ? 'bg-primary text-white rounded-tr-none'
                                : 'bg-card border border-border/30 text-foreground rounded-tl-none'
                            }`}
                          >
                            <span className="block text-[10px] font-bold text-primary/80 mb-1">
                              {msg.senderName}
                            </span>
                            <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input Box */}
                  <form onSubmit={handleSend} className="p-4 bg-card border-t border-border/30 flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={(e) => setInput(e.target.value)}
                      placeholder="Type your support message..."
                      className="flex-1 bg-secondary/20 rounded-2xl px-4 py-3 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 border border-transparent focus:border-primary/20"
                    />
                    <button
                      type="submit"
                      disabled={!input.trim()}
                      className="p-3 bg-primary text-white rounded-2xl hover:bg-primary/95 transition cursor-pointer flex items-center justify-center shadow-md shadow-primary/10"
                    >
                      <Send className="w-5 h-5" />
                    </button>
                  </form>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-secondary/5">
                  <MessageCircle className="w-12 h-12 text-muted-foreground/30 mb-2" />
                  <h3 className="font-playfair font-bold text-foreground">Select a Discussion</h3>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Choose an active guest or member chat session from the list on the left to begin messaging.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
