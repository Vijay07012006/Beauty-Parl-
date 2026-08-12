'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter, useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ComparisonTable } from '@/components/comparison/ComparisonTable';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Share2, Trash2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

function ComparePageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale || 'en';
  const { user } = useAuthStore();

  const [products, setProducts] = useState<any[]>([]);
  const [differences, setDifferences] = useState<any>({});
  const [loading, setLoading] = useState(true);

  // Comparison list identity: authenticated users are scoped server-side by their
  // JWT (HttpOnly cookie); guests get a dedicated, cryptographically-random session id (F4).
  const getSessionId = () => {
    if (user) return undefined;

    let id = localStorage.getItem('guest_compare_session_id');
    if (!id) {
      id = 'sess_' + (crypto.randomUUID?.() || Date.now().toString(36) + Math.random().toString(36).substring(2, 11));
      localStorage.setItem('guest_compare_session_id', id);
    }
    return id;
  };

  const getHeaders = () => {
    const sessionId = getSessionId();
    return {
      ...(sessionId ? { 'x-session-id': sessionId } : {}),
    };
  };

  const fetchCompareData = async () => {
    try {
      setLoading(true);
      const res = await api.get('/comparison/compare', { headers: getHeaders() });
      setProducts(res.data.products || []);
      setDifferences(res.data.differences || {});
    } catch (err) {
      console.error('Failed to load comparison data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const seedIds = searchParams.get('ids');
    if (seedIds) {
      const idsArray = seedIds.split(',').map(Number).filter(Boolean);
      const seedList = async () => {
        try {
          for (const id of idsArray) {
            await api.post(`/comparison/add/${id}`, {}, { headers: getHeaders() });
          }
          router.replace(`/${locale}/compare`);
        } catch (err) {
          console.error('Failed to seed comparison from link:', err);
        }
        fetchCompareData();
      };
      seedList();
    } else {
      fetchCompareData();
    }
  }, [searchParams]);

  const handleRemove = async (productId: number) => {
    try {
      await api.delete(`/comparison/remove/${productId}`, { headers: getHeaders() });
      toast.success('Product removed from comparison');
      fetchCompareData();
    } catch (err) {
      toast.error('Failed to remove product');
    }
  };

  const handleClear = async () => {
    try {
      await api.delete('/comparison/clear', { headers: getHeaders() });
      toast.success('Comparison list cleared');
      setProducts([]);
      setDifferences({});
    } catch (err) {
      toast.error('Failed to clear list');
    }
  };

  const handleShare = () => {
    if (products.length === 0) {
      toast.error('Add products first to share comparison!');
      return;
    }
    const ids = products.map((p) => p.id).join(',');
    const shareUrl = `${window.location.origin}/${locale}/compare?ids=${ids}`;
    
    navigator.clipboard.writeText(shareUrl);
    toast.success('Share link copied to clipboard! 📋');
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20 gap-2">
        <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
        <span className="text-sm font-semibold text-primary">Loading comparison...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <Link href={`/${locale}/products`} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition font-semibold mb-2">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Catalog
          </Link>
          <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">Product Comparison</h1>
        </div>

        {products.length > 0 && (
          <div className="flex items-center gap-3">
            <button
              onClick={handleShare}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition text-xs font-bold cursor-pointer"
            >
              <Share2 className="w-4 h-4" /> Share Link
            </button>
            <button
              onClick={handleClear}
              className="flex items-center gap-2 px-4 py-2.5 border border-border hover:bg-secondary/40 rounded-full transition text-xs font-semibold cursor-pointer"
            >
              <Trash2 className="w-4 h-4 text-red-500" /> Clear All
            </button>
          </div>
        )}
      </div>

      <ComparisonTable products={products} differences={differences} onRemove={handleRemove} />
    </div>
  );
}

export default function ComparePage() {
  return (
    <>
      <Header />
      <main className="min-h-[80vh] py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-5xl">
          <Suspense fallback={
            <div className="flex flex-col items-center justify-center py-20 gap-2">
              <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
              <span className="text-sm font-semibold text-primary">Loading comparison...</span>
            </div>
          }>
            <ComparePageContent />
          </Suspense>
        </div>
      </main>
      <Footer />
    </>
  );
}
