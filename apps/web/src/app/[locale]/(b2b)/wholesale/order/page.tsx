'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ArrowLeft, ShoppingBag, Percent, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
}

function WholesaleOrderContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [productId, setProductId] = useState('');
  const [quantity, setQuantity] = useState(50);
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Prefill check
  const prefillProductId = searchParams.get('productId');
  const prefillQty = searchParams.get('qty');

  useEffect(() => {
    if (!user || (user.role !== 'vendor' && user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Unauthorized access');
      router.push(`/${locale}/wholesale/login`);
      return;
    }

    async function loadProducts() {
      try {
        const res = await api.get('/products');
        const prods = Array.isArray(res.data) ? res.data : [];
        setProducts(prods);
        
        if (prefillProductId) {
          setProductId(prefillProductId);
        } else if (prods.length > 0) {
          setProductId(prods[0].id.toString());
        }

        if (prefillQty) {
          setQuantity(Number(prefillQty));
        }
      } catch {
        toast.error('Failed to load store catalog');
      } finally {
        setLoading(false);
      }
    }
    loadProducts();
  }, [user, prefillProductId, prefillQty]);

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!productId || quantity <= 0) {
      toast.error('Please configure valid product and quantity');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/wholesale/order', {
        items: [{ productId: Number(productId), quantity }],
      });
      toast.success('Wholesale bulk purchase order submitted successfully!');
      router.push(`/${locale}/wholesale/dashboard`);
    } catch {
      toast.error('Failed to record wholesale purchase order');
    } finally {
      setSubmitting(false);
    }
  };

  const selectedProduct = products.find((p) => p.id.toString() === productId);
  const retailPrice = selectedProduct ? Number(selectedProduct.price) : 0;
  const wholesalePrice = retailPrice * 0.70; // 30% B2B partner discount
  const subtotal = wholesalePrice * quantity;

  if (loading) {
    return (
      <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
        Loading wholesale order form...
      </div>
    );
  }

  return (
    <main className="flex-grow container mx-auto px-4 py-12 max-w-2xl space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href={`/${locale}/wholesale/dashboard`}
          className="p-2 bg-zinc-900 rounded-full hover:bg-zinc-800 transition text-zinc-400 hover:text-zinc-100 cursor-pointer"
        >
          <ArrowLeft size={16} />
        </Link>
        <div>
          <h1 className="text-2xl font-bold font-playfair tracking-tight">Bulk Restock Order</h1>
          <p className="text-xs text-zinc-400">Place bulk purchase orders with locked contract pricing.</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmitOrder}
        className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur"
      >
        {/* Product Selector */}
        <div className="space-y-2">
          <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
            Select Product Catalog Item
          </label>
          <select
            value={productId}
            onChange={(e) => setProductId(e.target.value)}
            className="w-full text-xs p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 cursor-pointer text-zinc-100"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} (Retail: ₹{p.price})
              </option>
            ))}
          </select>
        </div>

        {/* Bulk Quantity Selector */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
            Wholesale Quantity Preset
          </label>
          <div className="grid grid-cols-3 gap-2">
            {[50, 100, 500].map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setQuantity(preset)}
                className={`py-3 rounded-2xl border text-xs font-bold transition cursor-pointer select-none ${
                  quantity === preset
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700 text-zinc-300'
                }`}
              >
                {preset} Units
              </button>
            ))}
          </div>

          <div className="space-y-1.5 pt-2">
            <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider block">
              Or Specify Custom Quantity
            </label>
            <input
              type="number"
              min="10"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(10, Number(e.target.value)))}
              className="w-full text-xs p-3.5 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 font-mono"
            />
          </div>
        </div>

        {/* Pricing Estimator Panel */}
        {selectedProduct && (
          <div className="p-5 bg-zinc-950 rounded-2xl border border-zinc-850 space-y-4 shadow-inner">
            <div className="flex justify-between items-center text-xs">
              <span className="text-zinc-400">Unit Retail Price</span>
              <span className="font-mono text-zinc-300">₹{retailPrice}</span>
            </div>
            <div className="flex justify-between items-center text-xs border-b border-zinc-850 pb-3">
              <span className="text-zinc-400 flex items-center gap-1">
                <Percent size={12} className="text-emerald-500" /> B2B Contract Rate (30% discount)
              </span>
              <span className="font-mono text-emerald-500 font-bold">₹{wholesalePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-sm pt-2">
              <span className="font-bold text-zinc-200">Estimated Total (x{quantity})</span>
              <span className="font-mono text-primary text-lg font-bold">₹{subtotal.toFixed(2)}</span>
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={submitting || quantity <= 0}
          className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full flex items-center justify-center gap-1.5 shadow-lg transition hover:scale-[1.01] text-xs cursor-pointer disabled:opacity-50"
        >
          <ShoppingBag size={14} /> Submit Purchase Order
        </button>
      </form>
    </main>
  );
}

export default function WholesaleOrderPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />
      <Suspense fallback={
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Loading order details...
        </div>
      }>
        <WholesaleOrderContent />
      </Suspense>
      <Footer />
    </div>
  );
}
