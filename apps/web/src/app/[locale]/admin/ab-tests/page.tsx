'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Layers, Plus, Sparkles, Check, ArrowRight } from 'lucide-react';

interface ABTest {
  id: number;
  name: string;
  variantA: string;
  variantB: string;
  allocation: number;
  startDate: string;
}

export default function ABTestingAdminPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [tests, setTests] = useState<ABTest[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [name, setName] = useState('');
  const [variantA, setVariantA] = useState('');
  const [variantB, setVariantB] = useState('');
  const [allocation, setAllocation] = useState('0.5');
  const [submitting, setSubmitting] = useState(false);

  const fetchTests = async () => {
    try {
      const res = await api.get('/ab-tests/active');
      setTests(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load active experiments list');
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Admin clearance required.');
      router.push(`/${locale}/auth/login`);
      return;
    }

    async function init() {
      await fetchTests();
      setLoading(false);
    }
    init();
  }, [user]);

  const handleCreateTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !variantA.trim() || !variantB.trim()) {
      toast.error('Please complete all test properties');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/ab-tests', {
        name: name.trim(),
        variantA: variantA.trim(),
        variantB: variantB.trim(),
        allocation: Number(allocation),
      });
      toast.success('A/B Test experiment created and activated successfully!');
      setName('');
      setVariantA('');
      setVariantB('');
      setAllocation('0.5');
      await fetchTests();
    } catch {
      toast.error('Failed to create A/B Test');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Loading experiments logs...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        <div className="bg-gradient-to-r from-primary/10 to-accent/5 p-8 rounded-3xl border border-zinc-800/80">
          <h1 className="text-3xl font-bold font-playfair tracking-tight">🧪 A/B Testing Lab</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Conduct user-split experiments deterministically using consistent MD5 hashing splits.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Create Experiment form */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur">
            <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-primary" /> Create Experiment
            </h3>

            <form onSubmit={handleCreateTest} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Experiment Key / Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. PriceDisplayDiscount"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Variant A Key (Control)
                </label>
                <input
                  type="text"
                  value={variantA}
                  onChange={(e) => setVariantA(e.target.value)}
                  placeholder="e.g. show-price"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Variant B Key (Target)
                </label>
                <input
                  type="text"
                  value={variantB}
                  onChange={(e) => setVariantB(e.target.value)}
                  placeholder="e.g. show-discount"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Allocation Split for Variant B (e.g. 0.5 = 50%)
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  max="1.0"
                  value={allocation}
                  onChange={(e) => setAllocation(e.target.value)}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                Launch Experiment
              </button>
            </form>
          </div>

          {/* Active Experiments List */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-6 backdrop-blur">
            <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Layers size={18} className="text-primary" /> Active Split Experiments ({tests.length})
            </h3>

            <div className="space-y-4 overflow-y-auto max-h-[500px]">
              {tests.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-12 text-center">
                  No active split experiments created yet. Complete the form to deploy A/B splits.
                </p>
              ) : (
                tests.map((test) => (
                  <div
                    key={test.id}
                    className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 space-y-4"
                  >
                    <div className="flex justify-between items-center text-xs">
                      <h4 className="font-bold text-primary font-mono">{test.name}</h4>
                      <span className="text-[10px] text-zinc-500 font-mono">
                        Started: {new Date(test.startDate).toLocaleDateString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Control Variant A</span>
                        <span className="font-semibold text-zinc-300 font-mono">{test.variantA}</span>
                        <span className="text-[9px] text-zinc-500 block">Allocation: {Math.round((1 - test.allocation) * 100)}%</span>
                      </div>
                      <div className="p-3 bg-zinc-900/60 border border-zinc-850 rounded-xl space-y-1">
                        <span className="text-[9px] uppercase tracking-wider text-zinc-500 block">Test Variant B</span>
                        <span className="font-semibold text-zinc-300 font-mono">{test.variantB}</span>
                        <span className="text-[9px] text-zinc-500 block">Allocation: {Math.round(test.allocation * 100)}%</span>
                      </div>
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
