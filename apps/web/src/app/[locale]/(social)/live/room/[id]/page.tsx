'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { io, Socket } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  ShoppingCart,
  Plus,
  Minus,
  CheckCircle,
  Copy,
  Users,
} from 'lucide-react';

interface SharedCartItem {
  productId: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  addedByUserId: number;
}

interface Participant {
  userId: number;
  name: string;
  socketId: string;
}

export default function CoShoppingRoomPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const locale = (params?.locale as string) || 'en';

  const { user, token } = useAuthStore();

  const [participants, setParticipants] = useState<Participant[]>([]);
  const [cartItems, setCartItems] = useState<SharedCartItem[]>([]);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [videoEnabled, setVideoEnabled] = useState(true);
  const [audioEnabled, setAudioEnabled] = useState(true);

  const [streams, setStreams] = useState<{ [socketId: string]: MediaStream }>({});

  const socketRef = useRef<Socket | null>(null);
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const peersRef = useRef<{ [socketId: string]: any }>({});

  useEffect(() => {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parl-api.onrender.com';
    const socket = io(baseUrl, {
      auth: { token: token || undefined },
      withCredentials: true,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('🔌 Connected to Co-Shopping Socket Server');
      const guestName = user ? user.name : `Shopper_${Math.floor(Math.random() * 1000)}`;
      socket.emit('room:join', { roomId: id, name: guestName });
    });

    socket.on('room:state', (room: any) => {
      setParticipants(room.participants || []);
      setCartItems(room.sharedCartItems || []);
    });

    socket.on('room:checkout', () => {
      toast.success('Shopping together completed! Redirecting to cart...');
      router.push(`/${locale}/cart`);
    });

    socket.on('webrtc:signal', async (data: { senderSocketId: string; signal: any }) => {
      const peer = peersRef.current[data.senderSocketId];
      if (peer) {
        peer.signal(data.signal);
      } else {
        const Peer = (await import('simple-peer')).default;
        const newPeer = new Peer({
          initiator: false,
          trickle: false,
          stream: localStream || undefined,
        });

        newPeer.on('signal', (signal) => {
          socketRef.current?.emit('webrtc:signal', {
            roomId: id,
            targetSocketId: data.senderSocketId,
            signal,
          });
        });

        newPeer.on('stream', (stream) => {
          setStreams((prev) => ({ ...prev, [data.senderSocketId]: stream }));
        });

        newPeer.signal(data.signal);
        peersRef.current[data.senderSocketId] = newPeer;
      }
    });

    return () => {
      socket.disconnect();
      if (localStream) {
        localStream.getTracks().forEach((track) => track.stop());
      }
      Object.values(peersRef.current).forEach((p: any) => p.destroy());
    };
  }, [id, localStream]);

  useEffect(() => {
    if (typeof window !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices
        .getUserMedia({ video: true, audio: true })
        .then((stream) => {
          setLocalStream(stream);
          if (localVideoRef.current) {
            localVideoRef.current.srcObject = stream;
          }
        })
        .catch((err) => {
          console.warn('⚠️ Camera/mic permissions blocked:', err);
        });
    }
  }, []);

  const initiateCall = async (targetSocketId: string) => {
    const Peer = (await import('simple-peer')).default;
    const peer = new Peer({
      initiator: true,
      trickle: false,
      stream: localStream || undefined,
    });

    peer.on('signal', (signal) => {
      socketRef.current?.emit('webrtc:signal', {
        roomId: id,
        targetSocketId,
        signal,
      });
    });

    peer.on('stream', (stream) => {
      setStreams((prev) => ({ ...prev, [targetSocketId]: stream }));
    });

    peersRef.current[targetSocketId] = peer;
  };

  useEffect(() => {
    if (socketRef.current) {
      participants.forEach((p) => {
        if (socketRef.current && p.socketId !== socketRef.current.id && !peersRef.current[p.socketId]) {
          initiateCall(p.socketId);
        }
      });
    }
  }, [participants]);

  const toggleVideo = () => {
    if (localStream) {
      const track = localStream.getVideoTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setVideoEnabled(track.enabled);
      }
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      const track = localStream.getAudioTracks()[0];
      if (track) {
        track.enabled = !track.enabled;
        setAudioEnabled(track.enabled);
      }
    }
  };

  const copyInviteLink = () => {
    if (typeof window !== 'undefined') {
      const url = window.location.href;
      navigator.clipboard.writeText(url);
      toast.success('Invite link copied to clipboard!');
    }
  };

  const handleCheckoutTogether = async () => {
    try {
      await api.post(`/co-shopping/room/${id}/checkout`);
      toast.success('Distributed room items to everyone’s carts!');
    } catch {
      toast.error('Failed to trigger shared checkout');
    }
  };

  const handleUpdateItemQty = (productId: number, change: number) => {
    if (socketRef.current) {
      if (change > 0) {
        socketRef.current.emit('room:add-item', { roomId: id, productId, quantity: change });
      } else {
        socketRef.current.emit('room:remove-item', { roomId: id, productId, quantity: Math.abs(change) });
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3 space-y-6 flex flex-col justify-between">
          <div className="flex justify-between items-center bg-card/60 border border-border/40 backdrop-blur px-6 py-4 rounded-3xl shadow-lg">
            <div>
              <h1 className="text-xl font-bold font-playfair flex items-center gap-2">
                👥 Shared Shopping Space: <span className="text-primary font-mono select-all">{id}</span>
              </h1>
              <p className="text-xs text-muted-foreground">Collaborate on products and stream video real-time.</p>
            </div>
            <button
              onClick={copyInviteLink}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-secondary/80 text-xs font-semibold rounded-full transition-colors cursor-pointer"
            >
              Copy Invite Link
            </button>
          </div>

          <div className="flex-grow grid grid-cols-1 sm:grid-cols-2 gap-6 min-h-[400px]">
            <div className="relative rounded-3xl overflow-hidden bg-card/50 border border-border/40 shadow flex flex-col justify-end min-h-[220px]">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover rounded-3xl"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="relative p-4 flex justify-between items-center text-white z-10">
                <span className="text-xs font-semibold">You</span>
                <div className="flex gap-2">
                  <button
                    onClick={toggleVideo}
                    className={`p-2 rounded-full border border-white/20 transition-colors ${videoEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {videoEnabled ? <Video size={14} /> : <VideoOff size={14} />}
                  </button>
                  <button
                    onClick={toggleAudio}
                    className={`p-2 rounded-full border border-white/20 transition-colors ${audioEnabled ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500 hover:bg-red-600'}`}
                  >
                    {audioEnabled ? <Mic size={14} /> : <MicOff size={14} />}
                  </button>
                </div>
              </div>
            </div>

            {participants
              .filter((p) => socketRef.current && p.socketId !== socketRef.current.id)
              .map((p) => {
                const stream = streams[p.socketId];
                return (
                  <div key={p.socketId} className="relative rounded-3xl overflow-hidden bg-card/50 border border-border/40 shadow flex flex-col justify-end min-h-[220px]">
                    {stream ? (
                      <video
                        autoPlay
                        playsInline
                        ref={(el) => {
                          if (el) el.srcObject = stream;
                        }}
                        className="absolute inset-0 w-full h-full object-cover rounded-3xl"
                      />
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground bg-secondary/10">
                        <Users className="animate-pulse" size={24} />
                        <span className="text-[10px]">Connecting to WebRTC...</span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="relative p-4 text-white z-10 flex justify-between items-center">
                      <span className="text-xs font-semibold">{p.name}</span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>

        <div className="bg-card border border-border/40 backdrop-blur rounded-3xl p-6 shadow-xl flex flex-col justify-between h-[550px] lg:h-auto">
          <div>
            <h2 className="text-lg font-bold font-playfair flex items-center gap-2 border-b border-border pb-4 mb-4">
              Shared Room Cart
            </h2>

            <div className="space-y-4 overflow-y-auto max-h-[350px] pr-1">
              <AnimatePresence>
                {cartItems.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-center py-12 text-xs text-muted-foreground"
                  >
                    Your collaborative cart is empty. Add products to populate it!
                  </motion.div>
                ) : (
                  cartItems.map((item) => (
                    <motion.div
                      key={item.productId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-3 p-3 bg-secondary/15 rounded-2xl border border-border/20 shadow-sm"
                    >
                      {item.image && (
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-12 h-12 rounded-xl object-cover"
                        />
                      )}
                      <div className="flex-grow">
                        <h4 className="text-xs font-bold line-clamp-1">{item.name}</h4>
                        <p className="text-[10px] text-primary font-semibold font-mono">
                          ₹{item.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 bg-secondary/40 px-2 py-1 rounded-full border border-border/30">
                        <button
                          onClick={() => handleUpdateItemQty(item.productId, -1)}
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                        >
                          <Minus size={10} />
                        </button>
                        <span className="text-xs font-mono font-bold w-4 text-center">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => handleUpdateItemQty(item.productId, 1)}
                          className="text-muted-foreground hover:text-primary transition-colors p-0.5"
                        >
                          <Plus size={10} />
                        </button>
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>
            </div>
          </div>

          <div className="border-t border-border pt-4 mt-4 space-y-3">
            <button
              onClick={handleCheckoutTogether}
              disabled={cartItems.length === 0}
              className="w-full py-3 bg-primary hover:bg-primary/90 text-white rounded-full font-semibold text-xs flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <CheckCircle size={14} /> Checkout Together
            </button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
