'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TrackingMap } from '@/components/orders/TrackingMap';
import { io } from 'socket.io-client';
import { MapPin, Package, Truck, CheckCircle2, ChevronLeft } from 'lucide-react';
import { motion } from 'framer-motion';

export default function OrderTrackingPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = Number(params?.orderId);
  const locale = params?.locale || 'en';

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [trackingData, setTrackingData] = useState<any>({
    status: 'pending',
    latitude: null,
    longitude: null,
    history: [],
  });

  const fetchTracking = async () => {
    try {
      const res = await api.get(`/orders/${orderId}/tracking`);
      setTrackingData(res.data);
      setError('');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to load tracking data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!orderId) return;

    fetchTracking();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { transports: ['websocket'] });

    socket.on(`order_tracking_${orderId}`, (data: any) => {
      console.log('⚡ Live Order Tracking Update Received:', data);
      setTrackingData(data);
    });

    return () => {
      socket.disconnect();
    };
  }, [orderId]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16 flex items-center justify-center bg-secondary/5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Locating your package...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (error || !orderId) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16 flex items-center justify-center bg-secondary/5">
          <div className="text-center space-y-4 max-w-md p-6 bg-card rounded-2xl border border-border shadow-sm">
            <span className="text-4xl block select-none">🔍</span>
            <h2 className="text-xl font-bold text-foreground">Tracking Details Not Found</h2>
            <p className="text-sm text-muted-foreground">We couldn't retrieve tracking information for Order #{orderId}. Verification coordinates might not be generated yet.</p>
            <button
              onClick={() => router.push(`/${locale}/profile`)}
              className="px-6 py-2 bg-primary text-white rounded-full font-semibold hover:bg-primary/95 transition cursor-pointer text-sm"
            >
              Go to Profile
            </button>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500" />;
      case 'shipped':
        return <Truck className="w-5 h-5 text-blue-500 animate-bounce" />;
      case 'processing':
        return <Package className="w-5 h-5 text-amber-500 animate-pulse" />;
      default:
        return <MapPin className="w-5 h-5 text-primary" />;
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-10 bg-secondary/5">
        <div className="container mx-auto px-4 max-w-5xl space-y-8">
          {/* Back Button & Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-1">
              <button
                onClick={() => router.back()}
                className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition gap-1 mb-2 bg-card px-3 py-1.5 rounded-full border cursor-pointer"
              >
                <ChevronLeft size={14} /> Back
              </button>
              <h1 className="text-3xl font-playfair font-bold text-foreground">
                Live Order Tracking
              </h1>
              <p className="text-xs text-muted-foreground">Order ID: #{orderId} • Status: <span className="font-bold uppercase text-primary">{trackingData.status}</span></p>
            </div>
            {trackingData.latitude && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/25 rounded-full text-xs font-bold text-emerald-700">
                🟢 Live Connected
              </span>
            )}
          </div>

          {/* Map View */}
          {trackingData.latitude && trackingData.longitude ? (
            <TrackingMap latitude={Number(trackingData.latitude)} longitude={Number(trackingData.longitude)} />
          ) : (
            <div className="w-full bg-card rounded-2xl border border-border p-12 text-center shadow-sm space-y-4">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-2xl">
                📍
              </div>
              <h2 className="text-lg font-bold">Awaiting Map Dispatch</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">
                Your order is currently in the <span className="font-bold text-primary">{trackingData.status}</span> stage. Live map tracking will begin as soon as the courier sets out for delivery.
              </p>
            </div>
          )}

          {/* Timeline History */}
          <div className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              📋 Delivery Timeline
            </h2>

            {trackingData.history.length === 0 ? (
              <div className="py-6 text-center text-sm text-muted-foreground">
                Your package is being prepared. Update steps will appear shortly.
              </div>
            ) : (
              <div className="relative pl-6 border-l border-border space-y-8 ml-3">
                {trackingData.history.slice().reverse().map((step: any, index: number) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="relative"
                  >
                    {/* Circle Dot with Icon */}
                    <div className="absolute -left-11 top-1 bg-card rounded-full p-1 border border-border shadow-sm">
                      {getStatusIcon(step.status)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-sm capitalize">{step.status}</span>
                        <span className="text-[10px] text-muted-foreground font-medium">
                          {new Date(step.timestamp).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground">{step.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
