'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar, Play, Pause, X, RotateCw, ShoppingBag } from 'lucide-react';
import Link from 'next/link';

interface Subscription {
  id: number;
  frequency: 'monthly' | 'quarterly' | 'bi-monthly';
  quantity: number;
  nextDeliveryDate: string;
  isActive: boolean;
  product?: {
    id: number;
    name: string;
    price: number;
    image: string;
  };
}

export default function SubscriptionsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to manage your subscriptions');
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchSubscriptions();
  }, [user, locale]);

  const fetchSubscriptions = async () => {
    try {
      // The HttpOnly bp_token cookie is sent automatically via withCredentials
      const res = await api.get('/subscriptions');
      setSubscriptions(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load subscriptions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleActive = async (id: number, currentActive: boolean) => {
    try {
      // Simulate patch
      const sub = subscriptions.find((s) => s.id === id);
      if (sub) {
        sub.isActive = !currentActive;
        await api.put(`/subscriptions/${id}`, { frequency: sub.frequency, quantity: sub.quantity });
        setSubscriptions([...subscriptions]);
        toast.success(currentActive ? 'Subscription paused ⏸️' : 'Subscription resumed ▶️');
      }
    } catch {
      toast.error('Failed to modify subscription status');
    }
  };

  const handleSkipShipment = async (id: number) => {
    try {
      const sub = subscriptions.find((s) => s.id === id);
      if (sub) {
        const nextDate = new Date(sub.nextDeliveryDate);
        if (sub.frequency === 'monthly') nextDate.setDate(nextDate.getDate() + 30);
        else if (sub.frequency === 'bi-monthly') nextDate.setDate(nextDate.getDate() + 60);
        else nextDate.setDate(nextDate.getDate() + 90);

        sub.nextDeliveryDate = nextDate.toISOString();
        await api.put(`/subscriptions/${id}`, { frequency: sub.frequency, quantity: sub.quantity });
        setSubscriptions([...subscriptions]);
        toast.success('Next replenishment delivery skipped! 🚚');
      }
    } catch {
      toast.error('Failed to skip shipment');
    }
  };

  const handleCancel = async (id: number) => {
    try {
      await api.delete(`/subscriptions/${id}`);
      setSubscriptions(subscriptions.filter((s) => s.id !== id));
      toast.success('Subscription cancelled');
    } catch {
      toast.error('Failed to cancel subscription');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading subscriptions...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-foreground">My Replenishment Subscriptions</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Paused subscriptions won't trigger automatic deliveries. Swap, pause, or cancel at any time.
            </p>
          </div>

          {subscriptions.length === 0 ? (
            <div className="text-center py-16 bg-card border border-border/50 rounded-3xl space-y-4">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground font-medium">No auto-replenishment subscriptions found.</p>
              <Link
                href={`/${locale}/products`}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full font-bold text-xs hover:bg-primary/95 transition"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <AnimatePresence>
                {subscriptions.map((sub) => (
                  <motion.div
                    key={sub.id}
                    layout
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    className={`bg-card p-5 rounded-3xl border border-border/50 shadow-sm flex flex-col justify-between space-y-4 hover:shadow-md transition ${
                      !sub.isActive ? 'opacity-70' : ''
                    }`}
                  >
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-secondary/10 rounded-2xl overflow-hidden shrink-0">
                        <img src={sub.product?.image} alt={sub.product?.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="font-bold text-sm text-foreground line-clamp-1">{sub.product?.name}</h3>
                        <p className="text-xs font-bold text-primary">Rs. {Number(sub.product?.price).toFixed(2)}</p>
                        <div className="flex flex-wrap gap-2 pt-1.5">
                          <span className="px-2 py-0.5 bg-primary/5 text-primary border border-primary/20 text-[9px] font-bold uppercase rounded">
                            Every {sub.frequency}
                          </span>
                          <span className="px-2 py-0.5 bg-secondary text-muted-foreground text-[9px] font-bold uppercase rounded">
                            Qty: {sub.quantity}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="p-3 bg-secondary/15 rounded-2xl flex items-center justify-between text-[11px] text-muted-foreground font-medium">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" /> Next Delivery:
                      </span>
                      <span className="font-bold text-foreground">
                        {new Date(sub.nextDeliveryDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={() => handleToggleActive(sub.id, sub.isActive)}
                        className={`flex-1 py-2 rounded-xl text-[11px] font-bold transition flex items-center justify-center gap-1.5 cursor-pointer ${
                          sub.isActive
                            ? 'bg-secondary text-foreground hover:bg-secondary/80'
                            : 'bg-primary/10 text-primary hover:bg-primary/20'
                        }`}
                      >
                        {sub.isActive ? (
                          <>
                            <Pause className="w-3.5 h-3.5" /> Pause
                          </>
                        ) : (
                          <>
                            <Play className="w-3.5 h-3.5" /> Resume
                          </>
                        )}
                      </button>

                      {sub.isActive && (
                        <button
                          onClick={() => handleSkipShipment(sub.id)}
                          className="flex-1 py-2 bg-neutral-900 text-white rounded-xl text-[11px] font-bold hover:bg-neutral-850 transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <RotateCw className="w-3.5 h-3.5" /> Skip Next
                        </button>
                      )}

                      <button
                        onClick={() => handleCancel(sub.id)}
                        className="p-2 hover:bg-red-50 text-red-500 hover:text-red-700 rounded-xl transition cursor-pointer"
                        title="Cancel Subscription"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
