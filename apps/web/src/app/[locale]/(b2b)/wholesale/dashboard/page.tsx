'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sparkles, Calendar, ShoppingBag, ArrowRight, Layers, FileText } from 'lucide-react';

interface WholesaleOrder {
  id: number;
  total: number;
  status: string;
  createdAt: string;
  items: { name: string; quantity: number }[];
}

interface Suggestion {
  productId: number;
  name: string;
  suggestedQty: number;
  reason: string;
}

export default function WholesaleDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [orders, setOrders] = useState<WholesaleOrder[]>([]);
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || (user.role !== 'vendor' && user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Unauthorized access. Please login first.');
      router.push(`/${locale}/wholesale/login`);
      return;
    }

    async function loadDashboard() {
      try {
        const orderRes = await api.get('/wholesale/orders');
        setOrders(Array.isArray(orderRes.data) ? orderRes.data : []);

        const suggRes = await api.get('/wholesale/suggestions');
        setSuggestions(Array.isArray(suggRes.data) ? suggRes.data : []);
      } catch {
        toast.error('Failed to load wholesale dashboard data');
      } finally {
        setLoading(false);
      }
    }
    loadDashboard();
  }, [user]);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Loading wholesale environment...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        {/* Header Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/15 p-8 rounded-3xl border border-zinc-800/80">
          <div>
            <h1 className="text-3xl font-bold font-playfair tracking-tight">💼 Wholesale Hub</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Store partner: <span className="text-zinc-200 font-semibold">{user?.name}</span> • Manage wholesale orders and replenishment.
            </p>
          </div>
          <Link
            href={`/${locale}/wholesale/order`}
            className="px-6 py-3 bg-primary hover:bg-primary/95 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow transition hover:scale-105"
          >
            Create Bulk Order <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Replenishment Suggestions */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold font-playfair flex items-center gap-2 border-b border-zinc-800 pb-3">
              <Sparkles size={18} className="text-primary animate-pulse" /> AI Replenishment Advisor
            </h3>

            <div className="space-y-4">
              {suggestions.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-8 text-center">
                  No replenishment suggestions calculated. Complete orders to build history.
                </p>
              ) : (
                suggestions.map((sugg) => (
                  <div
                    key={sugg.productId}
                    className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{sugg.name}</h4>
                      <p className="text-[10px] text-zinc-400 mt-1">{sugg.reason}</p>
                    </div>
                    <div className="flex items-center gap-3 shrink-0">
                      <span className="text-xs font-bold font-mono px-3 py-1 bg-primary/10 text-primary border border-primary/20 rounded-full">
                        {sugg.suggestedQty} Units Suggested
                      </span>
                      <Link
                        href={`/${locale}/wholesale/order?productId=${sugg.productId}&qty=${sugg.suggestedQty}`}
                        className="px-3.5 py-1.5 bg-zinc-850 hover:bg-zinc-800 border border-zinc-800 text-[10px] font-bold rounded-full transition cursor-pointer"
                      >
                        Order Quantity
                      </Link>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Wholesale Orders History */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 p-6 rounded-3xl space-y-6">
            <h3 className="text-lg font-bold font-playfair flex items-center gap-2 border-b border-zinc-800 pb-3">
              <FileText size={18} className="text-primary" /> Purchase History
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[400px] pr-1">
              {orders.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-8 text-center">
                  No wholesale purchase orders recorded.
                </p>
              ) : (
                orders.map((ord) => (
                  <div
                    key={ord.id}
                    className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-850 space-y-2"
                  >
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="font-semibold text-zinc-300">Order #{ord.id}</span>
                      <span className="text-zinc-500 font-mono">
                        {new Date(ord.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="text-[10px] text-zinc-400 line-clamp-1">
                      {ord.items.map((it) => `${it.name} (x${it.quantity})`).join(', ')}
                    </div>
                    <div className="flex justify-between items-center pt-2 border-t border-zinc-850/50 text-[10px]">
                      <span className="font-bold text-primary font-mono">₹{ord.total}</span>
                      <span className="px-2 py-0.5 rounded-full bg-yellow-500/10 text-yellow-500 font-bold border border-yellow-500/20 uppercase tracking-wider text-[8px]">
                        {ord.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
