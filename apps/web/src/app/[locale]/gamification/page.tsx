'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Trophy, Shield, Award, Sparkles, User, RefreshCw } from 'lucide-react';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  pointsReward: number;
  unlocked: boolean;
}

interface LeaderboardUser {
  id: number;
  name: string;
  loyaltyPoints: number;
  loyaltyTier: string;
}

export default function GamificationPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { token } = useAuthStore();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      toast.error('Please sign in to view your achievements');
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchData();
  }, [token, locale]);

  const fetchData = async () => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const [achRes, leadRes] = await Promise.all([
        api.get('/gamification/achievements', { headers }),
        api.get('/gamification/leaderboard'),
      ]);

      setAchievements(Array.isArray(achRes.data) ? achRes.data : []);
      setLeaderboard(Array.isArray(leadRes.data) ? leadRes.data : []);
    } catch (err) {
      console.error('Failed to load gamification stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading achievements...</span>
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
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-4xl font-playfair font-bold text-foreground">Achievements & Leaderboard</h1>
              <p className="text-xs text-muted-foreground mt-1">
                Complete quests, unlock unique badges, and top our points leaderboards.
              </p>
            </div>
            <button
              onClick={fetchData}
              className="p-2 border border-border hover:bg-secondary rounded-xl transition cursor-pointer"
            >
              <RefreshCw className="w-4 h-4 text-muted-foreground" />
            </button>
          </div>

          {/* Leaderboard Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border border-border/50 p-6 rounded-3xl space-y-4 md:col-span-2">
              <h2 className="text-lg font-playfair font-bold text-foreground flex items-center gap-2">
                <Trophy className="w-5 h-5 text-amber-500" /> Top Points Leaderboard
              </h2>
              <div className="space-y-3">
                {leaderboard.map((user, index) => (
                  <div key={user.id} className="flex items-center justify-between p-3 bg-secondary/10 rounded-2xl border border-border/20 text-xs">
                    <div className="flex items-center gap-3">
                      <span className={`w-6 h-6 rounded-full flex items-center justify-center font-bold ${
                        index === 0 ? 'bg-amber-100 text-amber-600 dark:bg-amber-500/20 dark:text-amber-300' : index === 1 ? 'bg-slate-100 text-slate-600 dark:bg-slate-500/20 dark:text-slate-300' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {index + 1}
                      </span>
                      <div className="space-y-0.5">
                        <p className="font-semibold text-foreground">{user.name}</p>
                        <p className="text-[10px] text-muted-foreground capitalize">{user.loyaltyTier} Tier</p>
                      </div>
                    </div>
                    <span className="font-bold font-mono text-primary">{user.loyaltyPoints} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Achievements earned automatically as you shop */}
            <div className="bg-neutral-900 text-white p-6 rounded-3xl flex flex-col justify-between space-y-4">
              <div className="space-y-1">
                <h3 className="font-bold text-sm flex items-center gap-1.5 uppercase tracking-wide text-primary">
                  <Award className="w-4 h-4" /> How It Works
                </h3>
                <p className="text-[10px] text-white/55 leading-relaxed">
                  Achievements unlock automatically when you shop, review products, refer friends, and engage with Beauty Parlé.
                </p>
              </div>
            </div>
          </div>

          {/* Achievements Grid */}
          <div className="space-y-4">
            <h2 className="text-xl font-playfair font-bold text-foreground flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" /> Medals & Achievement Quests
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {achievements.map((ach) => (
                <div
                  key={ach.id}
                  className={`bg-card border p-5 rounded-3xl flex flex-col justify-between space-y-4 transition ${
                    ach.unlocked
                      ? 'border-primary/40 shadow-sm'
                      : 'border-border/30 opacity-70'
                  }`}
                >
                  <div className="space-y-3">
                    <div className="w-10 h-10 bg-secondary/15 rounded-2xl flex items-center justify-center text-lg shrink-0">
                      {ach.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-sm text-foreground flex items-center gap-1.5">
                        {ach.name}
                        {ach.unlocked && <Sparkles className="w-3.5 h-3.5 text-primary fill-primary animate-pulse" />}
                      </h3>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{ach.description}</p>
                    </div>
                  </div>

                  <div className="flex justify-between items-center pt-2 border-t border-border/10">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Reward:</span>
                    <span className="text-xs font-bold text-primary">+{ach.pointsReward} pts</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
