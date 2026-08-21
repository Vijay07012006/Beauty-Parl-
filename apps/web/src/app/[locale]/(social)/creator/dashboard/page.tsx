'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { DollarSign, Eye, Image as ImageIcon, Sparkles, Plus, Check } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function CreatorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();

  const [stats, setStats] = useState({ looksCount: 0, totalClicks: 0, totalEarnings: 0 });
  const [earnings, setEarnings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProductIds, setSelectedProductIds] = useState<number[]>([]);
  const [submittingLook, setSubmittingLook] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const res = await api.get('/ugc/creator/dashboard');
      setStats(res.data.stats || { looksCount: 0, totalClicks: 0, totalEarnings: 0 });
      setEarnings(Array.isArray(res.data?.earnings) ? res.data.earnings : []);
    } catch {
      toast.error('Failed to load creator dashboard statistics');
    }
  };

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to access the Creator Dashboard');
      router.push(`/${locale}/auth/login`);
      return;
    }

    async function init() {
      await fetchDashboardData();
      try {
        const prodRes = await api.get('/products');
        setProducts(Array.isArray(prodRes.data) ? prodRes.data : []);
      } catch {
        toast.error('Failed to load store products list');
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [user]);

  const handleUploadLook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !imageUrl.trim() || selectedProductIds.length === 0) {
      toast.error('Please fill in all look fields and tag at least one product');
      return;
    }

    setSubmittingLook(true);
    try {
      await api.post('/ugc/looks', {
        title,
        imageUrl,
        taggedProductIds: selectedProductIds,
      });
      toast.success('Creator look submitted successfully and is pending admin approval!');
      setTitle('');
      setImageUrl('');
      setSelectedProductIds([]);
      fetchDashboardData();
    } catch {
      toast.error('Failed to submit creator look');
    } finally {
      setSubmittingLook(false);
    }
  };

  const toggleTagProduct = (productId: number) => {
    setSelectedProductIds((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground py-20">
          Loading creator dashboard...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        <div className="bg-gradient-to-r from-primary/10 to-accent/5 p-8 rounded-3xl border border-border/40">
          <h1 className="text-3xl font-bold font-playfair flex items-center gap-3">
            ✨ Creator Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Track your looks performance, clicks, and earnings commissions.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-2xl text-primary">
              <ImageIcon size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Looks Uploaded</p>
              <h3 className="text-2xl font-bold font-playfair">{stats.looksCount}</h3>
            </div>
          </div>
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-accent/10 rounded-2xl text-accent-foreground">
              <Eye size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Referral Clicks</p>
              <h3 className="text-2xl font-bold font-playfair">{stats.totalClicks}</h3>
            </div>
          </div>
          <div className="bg-card border border-border/40 p-6 rounded-3xl shadow-sm flex items-center gap-4">
            <div className="p-3 bg-emerald-500/10 rounded-2xl text-emerald-600">
              <DollarSign size={24} />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Earnings</p>
              <h3 className="text-2xl font-bold font-playfair">₹{stats.totalEarnings}</h3>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-6">
            <h3 className="text-lg font-bold font-playfair border-b border-border pb-3 flex items-center gap-2">
              <Sparkles size={18} className="text-primary" /> Share a New Look
            </h3>

            <form onSubmit={handleUploadLook} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Look Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Summer Dewy Skin Glow..."
                  className="w-full text-xs p-3.5 bg-secondary/20 border border-border/40 rounded-2xl focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Image URL
                </label>
                <input
                  type="text"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/photo-..."
                  className="w-full text-xs p-3.5 bg-secondary/20 border border-border/40 rounded-2xl focus:outline-none focus:border-primary/50"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground block">
                  Tag Products (Tag at least one)
                </label>
                <div className="grid grid-cols-2 gap-2 max-h-[150px] overflow-y-auto border border-border/40 rounded-2xl p-3 bg-secondary/20">
                  {(Array.isArray(products) ? products : []).map((prod) => {
                    const isSelected = selectedProductIds.includes(prod.id);
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleTagProduct(prod.id)}
                        className={`p-2.5 rounded-xl border text-[10px] font-semibold flex items-center justify-between transition-all cursor-pointer ${isSelected ? 'bg-primary/10 border-primary text-primary' : 'bg-card border-border/40 text-muted-foreground hover:bg-secondary/40'}`}
                      >
                        <span className="truncate max-w-[150px]">{prod.name}</span>
                        {isSelected ? <Check size={10} /> : <Plus size={10} />}
                      </button>
                    );
                  })}
                </div>
              </div>

              <button
                type="submit"
                disabled={submittingLook || !title.trim() || !imageUrl.trim() || selectedProductIds.length === 0}
                className="w-full py-3 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-full flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Submit Look for Approval
              </button>
            </form>
          </div>

          <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm flex flex-col justify-between h-[450px] lg:h-auto">
            <div>
              <h3 className="text-lg font-bold font-playfair border-b border-border pb-3 flex items-center gap-2 mb-4">
                <DollarSign size={18} className="text-primary" /> Commissions Log
              </h3>

              <div className="space-y-3 overflow-y-auto max-h-[300px]">
                {earnings.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic py-8 text-center">
                    No commissions earned yet. Share looks to get referral traffic!
                  </p>
                ) : (
                  (Array.isArray(earnings) ? earnings : []).map((earn) => (
                    <div
                      key={earn.id}
                      className="p-3 bg-secondary/15 rounded-2xl border border-border/25 flex items-center justify-between"
                    >
                      <div>
                        <p className="text-[10px] text-muted-foreground">Order #{earn.orderId}</p>
                        <p className="text-[9px] text-muted-foreground font-mono">
                          {new Date(earn.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-emerald-600">+₹{earn.amount}</p>
                        <span className="text-[8px] uppercase tracking-wider font-bold px-1.5 py-0.5 rounded-full bg-yellow-500/10 text-yellow-600 border border-yellow-500/20">
                          {earn.status}
                        </span>
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
