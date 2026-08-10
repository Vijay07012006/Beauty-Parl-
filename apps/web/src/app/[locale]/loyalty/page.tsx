'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Award, Compass, Gift, Calendar, ArrowRightLeft, ShieldCheck, Check } from 'lucide-react';
import Link from 'next/link';

interface Transaction {
  id: number;
  points: number;
  reason: string;
  createdAt: string;
}

interface Reward {
  id: number;
  name: string;
  description: string;
  pointsRequired: number;
  discountAmount?: number;
  freeShipping: boolean;
}

export default function LoyaltyPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { token, user } = useAuthStore();

  const [pointsInfo, setPointsInfo] = useState({ points: 0, tier: 'silver', totalSpent: 0 });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeemedCode, setRedeemedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!token) {
      toast.error('Please sign in to view your loyalty dashboard');
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchData();
  }, [token, locale]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [ptsRes, txRes, rewRes] = await Promise.all([
        api.get('/loyalty/points', { headers }),
        api.get('/loyalty/transactions', { headers }),
        api.get('/loyalty/rewards'),
      ]);

      setPointsInfo(ptsRes.data);
      setTransactions(Array.isArray(txRes.data) ? txRes.data : []);
      setRewards(Array.isArray(rewRes.data) ? rewRes.data : []);
    } catch (err) {
      console.error('Failed to load loyalty details:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeem = async (rewardId: number) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await api.post(`/loyalty/redeem/${rewardId}`, {}, { headers });
      
      setRedeemedCode(res.data.rewardCode);
      toast.success('Reward redeemed successfully! 🎁');
      fetchData(); // reload points and transactions
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Insufficient points for redemption');
    }
  };

  const getTierProgress = () => {
    const pts = pointsInfo.points;
    if (pointsInfo.tier === 'platinum') return 100;
    if (pointsInfo.tier === 'gold') return ((pts - 100) / 400) * 100;
    return (pts / 100) * 100;
  };

  const getTierNextLimit = () => {
    if (pointsInfo.tier === 'platinum') return 'Platinum Master';
    if (pointsInfo.tier === 'gold') return '500 points for Platinum';
    return '100 points for Gold';
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading loyalty status...</span>
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
            <h1 className="text-4xl font-playfair font-bold text-foreground">Loyalty Rewards Program</h1>
            <p className="text-xs text-muted-foreground mt-1">
              Earn 10% points on all orders, level up tiers, and unlock exclusive discounts.
            </p>
          </div>

          {/* Points Card */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border/50 p-6 rounded-3xl space-y-4 md:col-span-2 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">My Points Balance</span>
                  <div className="text-4xl font-bold font-mono text-primary">{pointsInfo.points} pts</div>
                </div>
                <div className="px-3.5 py-1.5 bg-primary/10 border border-primary/20 rounded-full text-xs font-bold capitalize text-primary flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> {pointsInfo.tier} Member
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
                  <span>Progress</span>
                  <span>{getTierNextLimit()}</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${getTierProgress()}%` }} />
                </div>
              </div>
            </div>

            <div className="bg-neutral-900 text-white p-6 rounded-3xl flex flex-col justify-between">
              <div className="space-y-1">
                <span className="text-[10px] font-bold uppercase tracking-wider text-white/55">Total Accumulated Spend</span>
                <div className="text-3xl font-bold font-mono">Rs. {pointsInfo.totalSpent.toFixed(2)}</div>
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed mt-4">
                Thank you for choosing Beauty Parlé. Gold tier unlocks free shipping and Platinum unlocks 10% cashbacks!
              </p>
            </div>
          </div>

          {/* Redeemed Code Notification */}
          <AnimatePresence>
            {redeemedCode && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="bg-green-500/10 border border-green-500/25 p-5 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4"
              >
                <div className="space-y-1 text-center sm:text-left">
                  <h4 className="text-sm font-bold text-green-700 flex items-center gap-1.5 justify-center sm:justify-start">
                    <Check className="w-4.5 h-4.5" /> Coupon Redeemed!
                  </h4>
                  <p className="text-xs text-muted-foreground">Copy the voucher code below and input it at checkouts.</p>
                </div>
                <div className="flex gap-2">
                  <span className="px-4 py-2 bg-card border border-green-500/30 text-green-700 font-mono font-bold text-sm rounded-xl select-all">
                    {redeemedCode}
                  </span>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(redeemedCode);
                      toast.success('Voucher code copied to clipboard!');
                    }}
                    className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl hover:bg-green-700 transition cursor-pointer"
                  >
                    Copy
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Rewards Catalog */}
          <div className="space-y-4">
            <h2 className="text-xl font-playfair font-bold text-foreground flex items-center gap-2">
              <Gift className="w-5 h-5" /> Redeemable Rewards Catalog
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {rewards.map((reward) => (
                <div key={reward.id} className="bg-card border border-border/50 p-5 rounded-3xl flex flex-col justify-between space-y-4 hover:shadow-sm transition">
                  <div className="space-y-2">
                    <h3 className="font-bold text-sm text-foreground line-clamp-1">{reward.name}</h3>
                    <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">{reward.description}</p>
                  </div>
                  <div className="space-y-3 pt-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Cost:</span>
                      <span className="text-xs font-bold text-primary">{reward.pointsRequired} pts</span>
                    </div>
                    <button
                      onClick={() => handleRedeem(reward.id)}
                      disabled={pointsInfo.points < reward.pointsRequired}
                      className={`w-full py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
                        pointsInfo.points >= reward.pointsRequired
                          ? 'bg-primary text-white hover:bg-primary/95'
                          : 'bg-secondary text-muted-foreground cursor-not-allowed'
                      }`}
                    >
                      Redeem Reward
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Transactions Log */}
          <div className="space-y-4">
            <h2 className="text-xl font-playfair font-bold text-foreground flex items-center gap-2">
              <ArrowRightLeft className="w-5 h-5" /> Points History log
            </h2>
            <div className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm">
              {transactions.length === 0 ? (
                <div className="p-8 text-center text-xs text-muted-foreground">No points history transactions found.</div>
              ) : (
                <div className="divide-y divide-border/20">
                  {transactions.map((tx) => (
                    <div key={tx.id} className="p-4 flex justify-between items-center text-xs">
                      <div className="space-y-1 min-w-0">
                        <p className="font-semibold text-foreground truncate">{tx.reason}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" /> {new Date(tx.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <span className={`font-bold font-mono text-sm shrink-0 ${tx.points >= 0 ? 'text-green-600' : 'text-red-500'}`}>
                        {tx.points >= 0 ? `+${tx.points}` : tx.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
