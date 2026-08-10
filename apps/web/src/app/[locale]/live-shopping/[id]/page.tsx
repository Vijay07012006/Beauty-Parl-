'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Users, Sparkles, ShoppingCart, Tv } from 'lucide-react';

interface ChatMessage {
  name: string;
  text: string;
  time: string;
}

interface FeaturedProduct {
  productId: number;
  name: string;
  price: number;
  image?: string;
}

export default function LiveShoppingRoomPage() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = (params?.locale as string) || 'en';

  const { user, token } = useAuthStore();
  const { addItem } = useCartStore();

  const [event, setEvent] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [featuredProduct, setFeaturedProduct] = useState<FeaturedProduct | null>(null);
  const [loading, setLoading] = useState(true);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    fetchEventDetails();
    initWebSockets();

    return () => {
      if (socketRef.current) {
        socketRef.current.disconnect();
      }
    };
  }, [id]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchEventDetails = async () => {
    try {
      const res = await api.get(`/live-shopping/${id}`);
      setEvent(res.data);
      if (res.data.featuredProduct) {
        setFeaturedProduct({
          productId: res.data.featuredProduct.id,
          name: res.data.featuredProduct.name,
          price: Number(res.data.featuredProduct.price),
          image: res.data.featuredProduct.image,
        });
      }
    } catch {
      toast.error('Failed to load livestream details');
    } finally {
      setLoading(false);
    }
  };

  const initWebSockets = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    const socket = io(baseUrl);
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to Live Shopping Sockets');
      socket.emit('join_live_event', { eventId: id });
    });

    socket.on('live_chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('product_featured_alert', (prod: FeaturedProduct) => {
      setFeaturedProduct(prod);
      toast.info(`✨ Host pinned a featured product: ${prod.name}!`);
    });
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (!user) {
      toast.error('Please sign in to participate in the live chat');
      router.push(`/${locale}/auth/login`);
      return;
    }

    if (socketRef.current) {
      socketRef.current.emit('send_live_chat', {
        eventId: id,
        name: user.name || 'Anonymous',
        text: inputMessage,
      });
      setInputMessage('');
    }
  };

  const handleBuyFeatured = () => {
    if (!featuredProduct) return;
    addItem({
      id: featuredProduct.productId,
      name: featuredProduct.name,
      price: Number(featuredProduct.price),
      image: featuredProduct.image || '',
      maxStock: 99,
      quantity: 1,
    });
    toast.success(`🛒 Added pinned product ${featuredProduct.name} to cart!`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Joining stream room...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!event) return null;

  return (
    <>
      <Header />
      <main className="min-h-screen bg-black text-white flex flex-col md:flex-row">
        {/* Left Side: Video Player */}
        <div className="flex-1 relative aspect-video md:aspect-auto bg-neutral-950 flex items-center justify-center">
          {event.streamUrl ? (
            <video
              src={event.streamUrl}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center space-y-3">
              <Tv className="w-12 h-12 text-muted-foreground mx-auto animate-pulse" />
              <p className="text-xs text-muted-foreground">Video feed buffering...</p>
            </div>
          )}

          {/* Livestream Indicators Overlay */}
          <div className="absolute top-4 left-4 flex gap-2">
            <span className="bg-red-600 text-white font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider animate-pulse flex items-center gap-1">
              Live
            </span>
            <span className="bg-black/60 backdrop-blur-md text-white font-bold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5" /> 1.2k watching
            </span>
          </div>

          {/* Pinned Featured Product Card Overlay */}
          <AnimatePresence>
            {featuredProduct && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 30 }}
                className="absolute bottom-6 left-6 right-6 sm:left-6 sm:right-auto bg-black/85 border border-white/10 backdrop-blur-lg p-4 rounded-3xl max-w-sm flex gap-4 items-center"
              >
                <div className="w-14 h-14 bg-white/5 rounded-2xl overflow-hidden shrink-0">
                  <img src={featuredProduct.image} alt={featuredProduct.name} className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0 flex-1 space-y-1">
                  <span className="text-[8px] font-bold text-primary uppercase tracking-wider flex items-center gap-0.5">
                    <Sparkles className="w-3 h-3" /> Pinned Product
                  </span>
                  <h4 className="text-xs font-bold text-white truncate">{featuredProduct.name}</h4>
                  <p className="text-xs font-semibold text-primary">Rs. {Number(featuredProduct.price).toFixed(2)}</p>
                </div>
                <button
                  onClick={handleBuyFeatured}
                  className="px-4 py-2 bg-primary text-white font-bold text-xs rounded-full hover:bg-primary/95 transition flex items-center gap-1 cursor-pointer"
                >
                  <ShoppingCart className="w-3.5 h-3.5" /> Buy
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Side: Chat Container */}
        <div className="w-full md:w-96 border-t md:border-t-0 md:border-l border-white/10 bg-neutral-900 flex flex-col justify-between h-[450px] md:h-auto shrink-0">
          {/* Stream Information */}
          <div className="p-4 border-b border-white/10 space-y-1 bg-neutral-950">
            <h3 className="font-bold text-sm text-white line-clamp-1">{event.title}</h3>
            <p className="text-[10px] text-muted-foreground line-clamp-2">{event.description}</p>
          </div>

          {/* Scrolling Chat Room */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
            {messages.length === 0 ? (
              <div className="h-full flex items-center justify-center">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">Welcome to Live Chat</p>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div key={idx} className="text-xs leading-relaxed">
                  <span className="font-bold text-primary mr-1">{msg.name}</span>
                  <span className="text-white/95">{msg.text}</span>
                  <span className="text-[8px] text-white/40 ml-2">{msg.time}</span>
                </div>
              ))
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Message Input Box */}
          <form onSubmit={handleSendMessage} className="p-4 bg-neutral-950 border-t border-white/10 flex gap-2">
            <input
              type="text"
              placeholder="Join chat..."
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-3 py-2 text-xs text-white focus:outline-none focus:border-primary"
            />
            <button
              type="submit"
              className="p-2.5 bg-primary text-white rounded-full hover:bg-primary/95 transition cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
