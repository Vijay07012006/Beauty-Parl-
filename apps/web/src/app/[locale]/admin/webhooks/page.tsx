'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Link2, Plus, Terminal, RefreshCw, CheckCircle, XCircle } from 'lucide-react';

interface WebhookSubscription {
  id: number;
  url: string;
  events: string[];
  signingSecret: string;
  isActive: boolean;
}

interface WebhookAttempt {
  id: number;
  subscriptionId: number;
  event: string;
  responseStatus: number;
  responseBody: string;
  success: boolean;
  createdAt: string;
}

export default function WebhooksAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [subscriptions, setSubscriptions] = useState<WebhookSubscription[]>([]);
  const [attempts, setAttempts] = useState<WebhookAttempt[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [url, setUrl] = useState('');
  const [selectedEvents, setSelectedEvents] = useState<string[]>(['order.created']);
  const [submitting, setSubmitting] = useState(false);

  const loadData = async () => {
    try {
      const subRes = await api.get('/webhooks/subscriptions');
      setSubscriptions(Array.isArray(subRes.data) ? subRes.data : []);

      const attRes = await api.get('/webhooks/attempts');
      setAttempts(Array.isArray(attRes.data) ? attRes.data : []);
    } catch {
      toast.error('Failed to load webhook administrative records');
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Admin clearance required.');
      router.push(`/${locale}/auth/login`);
      return;
    }

    async function init() {
      await loadData();
      setLoading(false);
    }
    init();
  }, [user]);

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim() || selectedEvents.length === 0) {
      toast.error('Please specify target listener URL and at least one event');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/webhooks/subscribe', {
        url: url.trim(),
        events: selectedEvents,
      });
      toast.success('Webhook endpoint registered successfully!');
      setUrl('');
      await loadData();
    } catch {
      toast.error('Failed to register webhook subscription');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async (id: number) => {
    try {
      await api.post(`/webhooks/unsubscribe/${id}`);
      toast.success('Webhook endpoint deactivated');
      await loadData();
    } catch {
      toast.error('Failed to deactivate webhook');
    }
  };

  const toggleEventSelection = (event: string) => {
    setSelectedEvents((prev) =>
      prev.includes(event) ? prev.filter((e) => e !== event) : [...prev, event],
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Loading webhook configurations...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        <div className="bg-gradient-to-r from-primary/10 to-accent/5 p-8 rounded-3xl border border-zinc-800/80 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold font-playfair tracking-tight">🔌 Webhooks Console</h1>
            <p className="text-xs text-zinc-400 mt-1">
              Subscribe external ERP, CRM or inventory systems to platform transactional events.
            </p>
          </div>
          <button
            onClick={loadData}
            className="p-3 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-full transition cursor-pointer"
          >
            <RefreshCw size={14} className="text-zinc-400" />
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Subscription form */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur">
            <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-primary" /> New Subscription
            </h3>

            <form onSubmit={handleSubscribe} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Listener URL Endpoint
                </label>
                <div className="relative">
                  <Link2 size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://your-crm.com/webhooks"
                    className="w-full pl-9 pr-4 py-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Events Selection
                </label>
                <div className="space-y-2 border border-zinc-800 rounded-2xl p-3 bg-zinc-950/40">
                  {['order.created', 'payment.received', 'inventory.low'].map((ev) => {
                    const isSelected = selectedEvents.includes(ev);
                    return (
                      <button
                        key={ev}
                        type="button"
                        onClick={() => toggleEventSelection(ev)}
                        className={`w-full p-2.5 rounded-xl border text-[10px] font-bold flex items-center justify-between transition cursor-pointer select-none ${
                          isSelected
                            ? 'bg-primary/10 border-primary text-primary'
                            : 'bg-zinc-950 border-zinc-850 hover:border-zinc-800 text-zinc-400'
                        }`}
                      >
                        <span>{ev}</span>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          readOnly
                          className="w-3.5 h-3.5 accent-pink-500 cursor-pointer pointer-events-none"
                        />
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                Register Webhook
              </button>
            </form>
          </div>

          {/* Subscriptions & Logs */}
          <div className="lg:col-span-2 space-y-8">
            {/* Subscriptions List */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-6 backdrop-blur">
              <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3">
                Active Subscriptions ({subscriptions.length})
              </h3>
              <div className="space-y-3 max-h-[250px] overflow-y-auto">
                {subscriptions.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-6 text-center">
                    No active webhook subscriptions configured.
                  </p>
                ) : (
                  subscriptions.map((sub) => (
                    <div
                      key={sub.id}
                      className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 flex flex-col md:flex-row md:items-center justify-between gap-4"
                    >
                      <div className="space-y-1">
                        <p className="text-xs font-semibold text-zinc-200 font-mono line-clamp-1">{sub.url}</p>
                        <p className="text-[10px] text-zinc-400">Events: {sub.events.join(', ')}</p>
                        <p className="text-[8px] text-zinc-500 font-mono truncate max-w-[300px]">Secret: {sub.signingSecret}</p>
                      </div>
                      {sub.isActive ? (
                        <button
                          onClick={() => handleDeactivate(sub.id)}
                          className="px-3.5 py-1.5 bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 text-[10px] font-bold rounded-full transition cursor-pointer"
                        >
                          Deactivate
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest px-3 py-1.5 bg-zinc-900 border border-zinc-850 rounded-full">
                          Inactive
                        </span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Delivery Attempts Logs */}
            <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-6 backdrop-blur">
              <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
                <Terminal size={18} className="text-primary" /> Delivery Attempts Log
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {attempts.length === 0 ? (
                  <p className="text-xs text-zinc-500 italic py-8 text-center">
                    No webhook delivery attempts logged yet.
                  </p>
                ) : (
                  attempts.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 bg-zinc-950/60 rounded-2xl border border-zinc-850 flex items-center justify-between gap-4 text-xs"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-zinc-300 font-mono">{att.event}</span>
                          <span className="text-[9px] text-zinc-500 font-mono">
                            {new Date(att.createdAt).toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-[9px] text-zinc-400 font-mono line-clamp-1">Response: {att.responseBody || '(empty)'}</p>
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                        <span className={`text-[10px] font-bold font-mono px-2 py-0.5 rounded ${att.success ? 'bg-emerald-500/10 text-emerald-500' : 'bg-rose-500/10 text-rose-500'}`}>
                          HTTP {att.responseStatus}
                        </span>
                        {att.success ? (
                          <CheckCircle size={16} className="text-emerald-500" />
                        ) : (
                          <XCircle size={16} className="text-rose-500" />
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
