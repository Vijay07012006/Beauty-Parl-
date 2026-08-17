'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Share2, Users, Check, Gift, Copy, RefreshCw } from 'lucide-react';

export default function ReferralPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [stats, setStats] = useState({ code: null as string | null, referrals: 0, conversions: 0 });
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to view your referral dashboard');
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchStats();
  }, [user, locale]);

  const fetchStats = async () => {
    try {
      // The HttpOnly bp_token cookie is sent automatically via withCredentials
      const res = await api.get('/referral/stats');
      setStats(res.data);
    } catch (err) {
      console.error('Failed to load referral stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateCode = async () => {
    setGenerating(true);
    try {
      const res = await api.post('/referral/generate', {});
      toast.success('Unique referral code generated! 🤝');
      fetchStats();
    } catch {
      toast.error('Failed to generate referral code');
    } finally {
      setGenerating(false);
    }
  };

  const getReferralLink = () => {
    if (typeof window === 'undefined') return '';
    return `${window.location.origin}/${locale}/auth/register?ref=${stats.code || ''}`;
  };

  const handleCopyLink = () => {
    const link = getReferralLink();
    if (link) {
      navigator.clipboard.writeText(link);
      toast.success('Referral link copied to clipboard!');
    }
  };

  const handleCopyCode = () => {
    if (stats.code) {
      navigator.clipboard.writeText(stats.code);
      toast.success('Referral code copied to clipboard!');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading referrals...</span>
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
            <h1 className="text-4xl font-playfair font-bold text-foreground">Referral Program</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Invite friends to join Beauty Parlé. When they register using your code, both of you earn 50 points (equivalent to Rs. 50 cashbacks)!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Generate & Copy Widget */}
            <div className="bg-card border border-border/50 p-6 rounded-3xl space-y-5 md:col-span-2 flex flex-col justify-between">
              <div className="space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">My Referral Link</span>
                {stats.code ? (
                  <>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <input
                        type="text"
                        readOnly
                        value={getReferralLink()}
                        className="flex-1 bg-secondary/30 border border-border/30 rounded-2xl px-4 py-2.5 text-xs text-foreground font-medium focus:outline-none select-all"
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCopyLink}
                          className="py-2.5 px-4 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                        >
                          <Copy className="w-4 h-4" /> Copy Link
                        </button>
                        <button
                          onClick={handleCopyCode}
                          className="py-2.5 px-4 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-850 transition flex items-center gap-1.5 cursor-pointer"
                        >
                          Copy Code
                        </button>
                      </div>
                    </div>
                    <div className="flex gap-2 items-center flex-wrap pt-2">
                      <span className="text-[10px] text-muted-foreground font-semibold">Share:</span>
                      <a
                        href={`https://api.whatsapp.com/send?text=${encodeURIComponent('Join Beauty Parlé! Use my link to register and both of you will earn 50 points bonus: ' + getReferralLink())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-emerald-500 hover:bg-emerald-600 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        WhatsApp
                      </a>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getReferralLink())}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Facebook
                      </a>
                      <a
                        href={`mailto:?subject=${encodeURIComponent('Beauty Parlé Invite')}&body=${encodeURIComponent('Join Beauty Parlé! Use my link to register and both of you will earn 50 points bonus: ' + getReferralLink())}`}
                        className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white rounded-lg text-[10px] font-bold transition"
                      >
                        Email
                      </a>
                    </div>
                  </>
                ) : (
                  <div className="py-4 text-center">
                    <button
                      onClick={handleGenerateCode}
                      disabled={generating}
                      className="py-2.5 px-5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/10"
                    >
                      {generating ? 'Generating...' : 'Generate My Referral Code'}
                    </button>
                  </div>
                )}
              </div>

              <div className="p-4 bg-primary/5 border border-primary/15 rounded-2xl flex items-center gap-3">
                <Gift className="w-5 h-5 text-primary shrink-0" />
                <p className="text-[10px] text-muted-foreground leading-relaxed">
                  Referral code credits are automatically applied on your friend's registration. Points are updated in real-time.
                </p>
              </div>
            </div>

            {/* Referrals Stats Card */}
            <div className="bg-neutral-900 text-white p-6 rounded-3xl space-y-6 flex flex-col justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white/55 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-primary" /> Conversion Stats
              </h3>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-white/40 uppercase">Referrals</span>
                  <div className="text-2xl font-bold font-mono">{stats.referrals}</div>
                </div>
                <div className="space-y-1">
                  <span className="text-[9px] font-bold text-white/40 uppercase">Conversions</span>
                  <div className="text-2xl font-bold font-mono text-primary">{stats.conversions}</div>
                </div>
              </div>

              <button
                onClick={fetchStats}
                className="w-full py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[10px] font-bold text-white transition flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" /> Refresh Stats
              </button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
