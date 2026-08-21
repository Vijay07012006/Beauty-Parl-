'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Lock, Mail, ArrowRight, ShieldAlert } from 'lucide-react';

export default function WholesaleLoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { setSession } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      toast.error('Please enter email and password');
      return;
    }

    setLoading(true);
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user, token } = res.data;

      if (user.role === 'vendor' || user.role === 'admin' || user.role === 'super_admin') {
        setSession(token, user);
        toast.success(`Welcome back to B2B portal, ${user.name}!`);
        router.push(`/${locale}/wholesale/dashboard`);
      } else {
        toast.error('Access Denied: Only approved vendors can access this B2B portal.');
      }
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-md bg-zinc-900/60 border border-zinc-800/80 p-8 rounded-3xl shadow-2xl space-y-8 backdrop-blur">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary tracking-wider uppercase border border-primary/20">
              💼 B2B Portal
            </span>
            <h1 className="text-3xl font-bold font-playfair tracking-tight">Wholesale Login</h1>
            <p className="text-xs text-zinc-400">
              Access bulk pricing presets, AI restock predictions, and merchant dashboard.
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
                Corporate Email
              </label>
              <div className="relative">
                <Mail size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@business.com"
                  className="w-full text-xs pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
                Password
              </label>
              <div className="relative">
                <Lock size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full text-xs pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full flex items-center justify-center gap-1.5 shadow-lg transition hover:scale-[1.01] text-xs cursor-pointer disabled:opacity-50"
            >
              Authenticate Partner <ArrowRight size={14} />
            </button>
          </form>

          <div className="p-4 bg-zinc-500/5 rounded-2xl border border-zinc-500/10 text-[10px] leading-relaxed text-zinc-400 flex gap-2">
            <ShieldAlert size={14} className="shrink-0 text-yellow-500 mt-0.5" />
            <span>
              <strong>Note:</strong> Not a business partner yet? Register as a vendor on our platform to unlock wholesale access after approval.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
