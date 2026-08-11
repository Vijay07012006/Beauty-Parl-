'use client';

import { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { MessageCircle, X, Send, User } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  content: string;
  isAdmin: boolean;
  createdAt: Date;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [socket, setSocket] = useState<Socket | null>(null);
  const [roomId, setRoomId] = useState('');
  const [userProfile, setUserProfile] = useState<{ id: string; name: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Resolve user profile. Guest room id is now SERVER-ISSUED on connect,
    // so we no longer generate one locally.
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        setUserProfile({ id: `user_${parsed.id}`, name: parsed.name || 'Customer' });
        return;
      } catch {}
    }
    setUserProfile({ id: '', name: 'Guest' });
  }, []);

  useEffect(() => {
    if (!isOpen || !userProfile) return;

    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';
    const token = localStorage.getItem('token');
    const newSocket = io(baseUrl, {
      auth: {
        token: token || undefined,
      },
    });
    setSocket(newSocket);

    // Authenticated users are bound to their own room server-side (user_<id>).
    // Guests receive a server-assigned room before we can join it (CHAT-2).
    if (token) {
      try {
        const stored = JSON.parse(localStorage.getItem('user') || 'null');
        if (stored?.id) setRoomId(`user_${stored.id}`);
      } catch {}
    } else {
      newSocket.on('assigned_room', (assigned: string) => {
        setRoomId(assigned);
      });
    }

    // Event handlers
    newSocket.on('receive_message', (msg: ChatMessage) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev;
        return [...prev, msg];
      });
    });

    newSocket.on('message_history', (history: ChatMessage[]) => {
      setMessages(history);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [isOpen, userProfile]);

  // Join the room once we know its id (server-issued for guests, user_<id> for authed)
  useEffect(() => {
    if (!socket || !roomId || !userProfile) return;
    socket.emit('join_room', { roomId });
  }, [socket, roomId, userProfile]);

  useEffect(() => {
    // Scroll to bottom on new message
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || !socket || !userProfile || !roomId) return;

    socket.emit('send_message', {
      roomId,
      content: input.trim(),
      senderId: userProfile.id,
      senderName: userProfile.name,
      isAdmin: false,
    });

    setInput('');
  };

  return (
    <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 max-w-[calc(100vw-2rem)]">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="bg-card/95 backdrop-blur-xl border border-border/40 rounded-3xl w-[min(100vw-2rem,380px)] h-[min(70vh,500px)] sm:h-[min(75vh,520px)] shadow-2xl flex flex-col overflow-hidden mb-3 sm:mb-4"
          >
            {/* Header */}
            <div className="bg-primary p-4 text-white flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center font-bold">
                  💄
                </div>
                <div>
                  <h3 className="font-playfair font-bold text-sm leading-none">Beauty Parlé Support</h3>
                  <span className="text-[10px] text-white/80">FAQ Bot & Live Agents</span>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/20 rounded-full transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Messages Body */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-secondary/5">
              {messages.map((msg) => {
                const isMe = msg.senderId === userProfile?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[75%] rounded-2xl p-3 text-sm shadow-sm ${
                        isMe
                          ? 'bg-primary text-primary-foreground font-medium rounded-tr-none'
                          : 'bg-card border border-border/30 text-foreground rounded-tl-none'
                      }`}
                    >
                      {!isMe && (
                        <span className="block text-[10px] font-semibold text-primary mb-1">
                          {msg.senderName}
                        </span>
                      )}
                      <p className="whitespace-pre-line leading-relaxed">{msg.content}</p>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Form */}
            <form onSubmit={handleSend} className="p-3 bg-card border-t border-border/30 flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type a message or number..."
                className="flex-1 bg-secondary/20 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-1 focus:ring-primary/40 border border-transparent focus:border-primary/20"
              />
              <button
                type="submit"
                disabled={!input.trim()}
                className="p-2.5 bg-primary text-white rounded-xl hover:bg-primary/95 transition disabled:opacity-50 cursor-pointer flex items-center justify-center"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close chat' : 'Open chat'}
        className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-primary text-white flex items-center justify-center shadow-lg shadow-primary/20 cursor-pointer ml-auto"
      >
        {isOpen ? <X className="w-6 h-6" /> : <MessageCircle className="w-6 h-6" />}
      </motion.button>
    </div>
  );
}
