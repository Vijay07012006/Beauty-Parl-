'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, RefreshCcw, PackageCheck, HelpCircle } from 'lucide-react';
import Link from 'next/link';

export default function ReturnsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);

  const [selectedOrderId, setSelectedOrderId] = useState<string>('');
  const [reason, setReason] = useState<string>('');

  const fetchData = async () => {
    if (!user) return;
    try {
      const [ordersRes, returnsRes] = await Promise.all([
        api.get('/orders'),
        api.get('/returns'),
      ]);
      
      // Filter for delivered orders that don't have return requests already
      const returnOrderIds = (returnsRes.data || []).map((r: any) => r.orderId);
      const deliveredOrders = (ordersRes.data || []).filter(
        (o: any) => o.status === 'delivered' && !returnOrderIds.includes(o.id)
      );

      setOrders(deliveredOrders);
      setReturns(returnsRes.data || []);
    } catch (err) {
      console.error('Failed to load returns data', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push(`/${locale}/auth/login?redirect=returns`);
      return;
    }
    fetchData();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOrderId || !reason) {
      toast.error('Please select an order and provide a reason');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/returns', {
        orderId: Number(selectedOrderId),
        reason,
      });
      toast.success('Return request submitted successfully! We will coordinate pickup details.');
      setSelectedOrderId('');
      setReason('');
      fetchData(); // Refresh lists
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to submit return request. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20';
      case 'approved':
        return 'bg-blue-500/10 text-blue-600 border-blue-500/20';
      case 'rejected':
        return 'bg-red-500/10 text-red-600 border-red-500/20';
      default:
        return 'bg-amber-500/10 text-amber-600 border-amber-500/20';
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-16 flex items-center justify-center bg-secondary/5">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading returns dashboard...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/5">
        <div className="container mx-auto px-4 max-w-5xl space-y-10">
          {/* Header */}
          <div className="flex flex-col gap-2">
            <Link
              href={`/${locale}/profile`}
              className="inline-flex items-center text-xs font-semibold text-muted-foreground hover:text-primary transition gap-1 mb-2 bg-card w-fit px-3 py-1.5 rounded-full border"
            >
              <ArrowLeft size={14} /> Back to Profile
            </Link>
            <h1 className="text-4xl font-playfair font-bold text-foreground">Hassle-Free Returns</h1>
            <p className="text-sm text-muted-foreground">Submit a return request and schedule a home pickup within 7 days of delivery.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Form Section */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-4">
                <h2 className="text-lg font-bold text-foreground flex items-center gap-2">
                  <RefreshCcw size={18} className="text-primary animate-spin-slow" /> New Return Request
                </h2>

                {orders.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    No eligible orders found. You can only request returns for orders marked as <strong className="text-foreground">Delivered</strong> within the last 7 days.
                  </p>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Select Order</label>
                      <select
                        value={selectedOrderId}
                        onChange={(e) => setSelectedOrderId(e.target.value)}
                        required
                        className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm cursor-pointer"
                      >
                        <option value="">Choose an eligible order...</option>
                        {orders.map((o) => (
                          <option key={o.id} value={o.id}>
                            Order #{o.id} - ${Number(o.total).toFixed(2)} ({new Date(o.createdAt).toLocaleDateString()})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">Reason for Return</label>
                      <textarea
                        value={reason}
                        onChange={(e) => setReason(e.target.value)}
                        placeholder="Please describe why you are requesting a return (e.g. damaged item, incorrect shade delivered, allergic reaction)..."
                        required
                        rows={4}
                        className="w-full p-3.5 rounded-xl border border-input bg-background text-sm resize-none focus:ring-2 focus:ring-primary/45 focus:outline-none"
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={submitting}
                      className="w-full py-3 bg-primary text-white text-sm font-bold rounded-xl hover:bg-primary/95 transition cursor-pointer disabled:opacity-50"
                    >
                      {submitting ? 'Submitting...' : 'Submit Request'}
                    </button>
                  </form>
                )}
              </div>

              {/* Information Block */}
              <div className="bg-card border border-border/60 p-6 rounded-2xl shadow-sm text-xs space-y-3">
                <h3 className="font-bold flex items-center gap-1"><HelpCircle size={14} className="text-primary" /> Return Policy</h3>
                <ul className="list-disc pl-4 space-y-2 text-muted-foreground">
                  <li>Requests must be filed within 7 days of delivery.</li>
                  <li>Products must be unused and in original packaging.</li>
                  <li>Pickups are free and are scheduled within 24-48 hours of approval.</li>
                  <li>Refunds are credited back to the original source upon pickup completion.</li>
                </ul>
              </div>
            </div>

            {/* List Section */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border p-6 rounded-2xl shadow-sm space-y-6">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <PackageCheck size={20} className="text-primary" /> Your Return Requests
                </h2>

                {returns.length === 0 ? (
                  <div className="py-12 text-center text-sm text-muted-foreground">
                    You have not submitted any return requests yet.
                  </div>
                ) : (
                  <div className="space-y-4">
                    {returns.map((ret) => (
                      <div
                        key={ret.id}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 border border-border/50 rounded-xl hover:border-primary/25 hover:bg-primary/5 transition gap-4"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2.5">
                            <span className="font-bold text-sm">Request #{ret.id}</span>
                            <span className="text-xs text-muted-foreground font-medium">Order #{ret.orderId}</span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-1">{ret.reason}</p>
                          <span className="text-[10px] text-muted-foreground block">
                            Requested on: {new Date(ret.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 self-end sm:self-center">
                          <span className={`px-2.5 py-1 text-[10px] font-bold rounded-full border capitalize ${getStatusColor(ret.status)}`}>
                            {ret.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
