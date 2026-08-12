'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { io, Socket } from 'socket.io-client';
import { toast } from 'sonner';
import { Tv, Users, Send, Pin, AlertCircle, Play, Square, RefreshCw } from 'lucide-react';

interface ChatMessage {
  name: string;
  text: string;
  time: string;
}

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  category: string;
}

export default function AdminLiveControlRoom() {
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;
  const locale = (params?.locale as string) || 'en';

  const { token } = useAuthStore();

  const [event, setEvent] = useState<any | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [pinnedProduct, setPinnedProduct] = useState<Product | null>(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isBroadcasting, setIsBroadcasting] = useState(false);

  const socketRef = useRef<Socket | null>(null);
  const chatEndRef = useRef<HTMLDivElement | null>(null);

  const fetchEventDetails = async () => {
    try {
      const [eventRes, productsRes] = await Promise.all([
        api.get(`/live-shopping/${id}`),
        api.get('/products?limit=50').catch(() => ({ data: [] })),
      ]);

      setEvent(eventRes.data);
      setIsBroadcasting(eventRes.data.status === 'live');
      if (eventRes.data.featuredProduct) {
        setPinnedProduct(eventRes.data.featuredProduct);
      }
      setProducts(Array.isArray(productsRes.data) ? productsRes.data : productsRes.data.products || []);
    } catch {
      toast.error('Failed to load control room details');
      router.push(`/${locale}/admin/live-shopping`);
    } finally {
      setLoading(false);
    }
  };

  const initWebSockets = () => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';
    const socket = io(baseUrl, {
      withCredentials: true,
      auth: { token: token || undefined },
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to Live Moderation Sockets');
      socket.emit('join_live_event', { eventId: id });
    });

    socket.on('live_chat_message', (msg: ChatMessage) => {
      setMessages((prev) => [...prev, msg]);
    });

    socket.on('viewer_count_update', (count: number) => {
      setViewerCount(count);
    });
  };

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

  const handleToggleBroadcast = async () => {
    const nextStatus = isBroadcasting ? 'ended' : 'live';
    try {
      const res = await api.put(`/live-shopping/${id}/status`, { status: nextStatus });
      setEvent(res.data);
      setIsBroadcasting(nextStatus === 'live');
      toast.success(nextStatus === 'live' ? 'Livestream is now active!' : 'Livestream broadcast ended.');
    } catch {
      toast.error('Failed to update livestream status');
    }
  };

  const handlePinProduct = async (product: Product) => {
    try {
      await api.post(`/live-shopping/${id}/feature-product`, { productId: product.id });
      setPinnedProduct(product);
      toast.success(`Pinned ${product.name} as live recommendation`);
      
      // Emit socket notification to all listeners
      if (socketRef.current) {
        socketRef.current.emit('feature_product_alert', {
          eventId: id,
          product: {
            productId: product.id,
            name: product.name,
            price: Number(product.price),
            image: product.image,
          },
        });
      }
    } catch {
      toast.error('Failed to pin product');
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim()) return;

    if (socketRef.current) {
      socketRef.current.emit('send_live_chat', {
        eventId: id,
        text: inputMessage,
      });
      setInputMessage('');
    }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="min-h-[50vh] flex flex-col items-center justify-center gap-2">
          <RefreshCw className="w-8 h-8 animate-spin text-primary" />
          <span className="text-sm font-medium text-primary">Entering Control Room...</span>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header Console */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-card p-6 rounded-3xl border border-border/50 shadow-sm">
          <div>
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${isBroadcasting ? 'bg-red-500 animate-ping' : 'bg-slate-400'}`} />
              <h1 className="text-2xl font-playfair font-bold text-foreground">
                Control Room: {event?.title}
              </h1>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">{event?.description}</p>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            {/* Viewer Count */}
            <div className="px-4 py-2 bg-secondary/30 rounded-full flex items-center gap-2 text-xs font-semibold text-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>{viewerCount} Live Viewers</span>
            </div>

            {/* Broadcast Toggle */}
            <button
              onClick={handleToggleBroadcast}
              className={`flex-1 md:flex-none px-5 py-2.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer text-white shadow-md ${
                isBroadcasting 
                  ? 'bg-red-500 hover:bg-red-600 shadow-red-500/20' 
                  : 'bg-primary hover:bg-primary/95 shadow-primary/20'
              }`}
            >
              {isBroadcasting ? (
                <>
                  <Square size={14} fill="currentColor" />
                  <span>End Stream</span>
                </>
              ) : (
                <>
                  <Play size={14} fill="currentColor" />
                  <span>Go Live</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left: Stream monitor & Pinned Product (Col 8) */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Video Placeholder Box */}
            <div className="relative aspect-video w-full bg-slate-950 rounded-3xl overflow-hidden shadow-md border border-border/50 flex flex-col items-center justify-center p-6 text-center">
              <div className="absolute top-4 right-4 bg-red-500 text-white text-[10px] font-bold tracking-widest uppercase px-2 py-0.5 rounded-full">
                {isBroadcasting ? 'LIVE FEED' : 'OFFLINE'}
              </div>
              <Tv size={48} className="text-slate-700 stroke-[1.2] mb-3" />
              <h4 className="font-playfair font-bold text-base text-slate-300">
                {isBroadcasting ? 'Broadcasting to Main Stage' : 'Camera Feed Ready'}
              </h4>
              <p className="text-xs text-muted-foreground max-w-xs mt-1">
                Your camera is active. Click "Go Live" at the top to display this stream to customers.
              </p>
            </div>

            {/* Pinned Product Card */}
            <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Pin className="w-4 h-4 fill-current" />
                <h3 className="font-playfair font-bold text-base text-foreground">Featured Live Product</h3>
              </div>

              {pinnedProduct ? (
                <div className="flex items-center justify-between p-4 bg-primary/5 border border-primary/10 rounded-2xl">
                  <div className="flex gap-4">
                    <div className="w-16 h-16 bg-white border border-border/40 rounded-xl flex items-center justify-center text-2xl shrink-0">
                      💄
                    </div>
                    <div>
                      <h4 className="font-bold text-sm text-foreground">{pinnedProduct.name}</h4>
                      <p className="text-xs font-bold text-primary mt-0.5">${Number(pinnedProduct.price).toFixed(2)}</p>
                    </div>
                  </div>
                  <span className="text-[10px] bg-emerald-500/10 text-emerald-600 font-bold uppercase px-3 py-1 rounded-full border border-emerald-500/25">
                    Pinned Live
                  </span>
                </div>
              ) : (
                <div className="p-4 bg-secondary/15 border border-dashed border-border/60 text-center rounded-2xl text-xs text-muted-foreground">
                  No product currently pinned. Select one from the library below to promote it.
                </div>
              )}
            </div>

            {/* Product Library selector */}
            <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm space-y-4">
              <h3 className="font-playfair font-bold text-base text-foreground">Pin a Product</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-[220px] overflow-y-auto pr-2">
                {products.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => handlePinProduct(product)}
                    className="p-3 text-left bg-secondary/20 hover:bg-secondary/40 border border-border/40 rounded-2xl transition flex items-center gap-3 cursor-pointer text-xs"
                  >
                    <div className="w-10 h-10 bg-white border border-border/40 rounded-lg flex items-center justify-center shrink-0">
                      💄
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate">{product.name}</p>
                      <p className="text-[10px] text-primary font-semibold mt-0.5">${Number(product.price).toFixed(2)}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

          </div>

          {/* Right: Real-time Moderate chat (Col 4) */}
          <div className="lg:col-span-4 bg-card rounded-3xl border border-border/50 shadow-sm flex flex-col h-[600px] overflow-hidden">
            <div className="p-4 border-b border-border/50 bg-secondary/15 flex justify-between items-center">
              <h3 className="font-bold text-sm text-foreground">Moderator Chat</h3>
              <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Host view</span>
            </div>

            {/* Chat Messages */}
            <div className="flex-1 p-4 overflow-y-auto space-y-3">
              {messages.length === 0 ? (
                <div className="h-full flex items-center justify-center text-center p-4 text-xs text-muted-foreground">
                  <div className="space-y-1">
                    <Tv className="w-8 h-8 mx-auto text-muted-foreground/30 stroke-[1.2]" />
                    <p>Stream chat is quiet. Broadcast alerts will post here.</p>
                  </div>
                </div>
              ) : (
                messages.map((msg, idx) => (
                  <div key={idx} className="bg-secondary/20 p-3 rounded-2xl text-xs space-y-0.5">
                    <div className="flex justify-between items-center">
                      <span className="font-bold text-primary">{msg.name}</span>
                      <span className="text-[9px] text-muted-foreground">{msg.time}</span>
                    </div>
                    <p className="text-foreground leading-relaxed">{msg.text}</p>
                  </div>
                ))
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Message input */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-border/50 bg-secondary/10 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="Announce to stream..."
                className="flex-1 p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary/40 text-xs"
              />
              <button
                type="submit"
                disabled={!inputMessage.trim()}
                className="p-3 bg-primary text-white rounded-xl hover:bg-primary/95 transition disabled:opacity-50 cursor-pointer shadow-sm"
              >
                <Send size={14} />
              </button>
            </form>
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
