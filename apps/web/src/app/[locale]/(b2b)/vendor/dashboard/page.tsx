'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Sparkles, Layers, Plus, Clipboard, Tag, Check } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  stock: number;
  category?: string;
  brand?: string;
}

export default function VendorDashboardPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Add Product form states
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('50');
  const [category, setCategory] = useState('Skincare');
  const [brand, setBrand] = useState('');
  const [image, setImage] = useState('');
  const [submittingProduct, setSubmittingProduct] = useState(false);

  const fetchVendorProducts = async () => {
    try {
      const res = await api.get('/vendor/products');
      setProducts(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to load merchant products list');
    }
  };

  useEffect(() => {
    if (!user || user.role !== 'vendor') {
      toast.error('Merchant dashboard requires authorized vendor login');
      router.push(`/${locale}/wholesale/login`);
      return;
    }

    async function init() {
      await fetchVendorProducts();
      setLoading(false);
    }
    init();
  }, [user]);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim() || !price.trim() || !stock.trim()) {
      toast.error('Please complete all required product fields');
      return;
    }

    setSubmittingProduct(true);
    try {
      await api.post('/vendor/products', {
        name,
        description,
        price: Number(price),
        stock: Number(stock),
        category,
        brand: brand.trim() || undefined,
        image: image.trim() || '/images/products/placeholder.jpg',
      });
      toast.success('Product listed successfully in global catalog!');
      setName('');
      setDescription('');
      setPrice('');
      setBrand('');
      setImage('');
      await fetchVendorProducts();
    } catch {
      toast.error('Failed to list merchant product');
    } finally {
      setSubmittingProduct(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Loading merchant catalog...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        {/* Header Header */}
        <div className="bg-gradient-to-r from-primary/10 to-accent/5 p-8 rounded-3xl border border-zinc-800/80">
          <h1 className="text-3xl font-bold font-playfair tracking-tight">🏢 Merchant Console</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Manage your listed catalog items, pricing, and live inventory distributions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Add Product Form */}
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur">
            <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Plus size={18} className="text-primary" /> List New Product
            </h3>

            <form onSubmit={handleAddProduct} className="space-y-4 text-xs">
              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Product Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Lavender Hydration mist"
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Enter dynamic features and organic components list..."
                  rows={4}
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                    Retail Price (₹)
                  </label>
                  <input
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="999"
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 font-mono"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                    Initial Stock
                  </label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(e.target.value)}
                    placeholder="50"
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100 cursor-pointer"
                  >
                    <option value="Skincare">Skincare</option>
                    <option value="Makeup">Makeup</option>
                    <option value="Haircare">Haircare</option>
                    <option value="Fragrance">Fragrance</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                    Brand Label
                  </label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    placeholder="Your Brand"
                    className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-zinc-400 font-semibold uppercase tracking-wider block">
                  Product Image URL (Optional)
                </label>
                <input
                  type="text"
                  value={image}
                  onChange={(e) => setImage(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-3 bg-zinc-950 border border-zinc-800 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                />
              </div>

              <button
                type="submit"
                disabled={submittingProduct}
                className="w-full py-3.5 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full flex items-center justify-center gap-1.5 shadow transition-all cursor-pointer disabled:opacity-50"
              >
                Publish Catalog Item
              </button>
            </form>
          </div>

          {/* Listed Products Inventory */}
          <div className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 space-y-6 backdrop-blur">
            <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
              <Layers size={18} className="text-primary" /> Active Merchant Catalog ({products.length})
            </h3>

            <div className="space-y-3 overflow-y-auto max-h-[500px]">
              {products.length === 0 ? (
                <p className="text-xs text-zinc-500 italic py-12 text-center">
                  You have not published any products in the catalog yet. Use the sidebar form to add items.
                </p>
              ) : (
                products.map((prod) => (
                  <div
                    key={prod.id}
                    className="p-4 bg-zinc-950/60 rounded-2xl border border-zinc-850 flex items-center justify-between gap-4"
                  >
                    <div>
                      <h4 className="text-xs font-bold text-zinc-200">{prod.name}</h4>
                      <div className="flex gap-3 text-[10px] text-zinc-400 mt-1">
                        <span>Brand: <strong>{prod.brand || 'Unbranded'}</strong></span>
                        <span>•</span>
                        <span>Category: <strong>{prod.category}</strong></span>
                      </div>
                    </div>
                    <div className="text-right shrink-0 flex items-center gap-6">
                      <div>
                        <p className="text-xs font-bold text-primary font-mono">₹{prod.price}</p>
                        <p className={`text-[10px] ${prod.stock < 10 ? 'text-rose-500 font-bold' : 'text-zinc-500'}`}>
                          Stock: {prod.stock} {prod.stock < 10 && '⚠️ Low'}
                        </p>
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
