'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { toast } from 'sonner';
import { ShoppingBag, Tag, User } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  image?: string;
  stock?: number;
}

interface CreatorLook {
  id: number;
  title: string;
  imageUrl: string;
  taggedProductIds: number[];
  user?: {
    id: number;
    name: string;
    avatar?: string;
  };
}

export default function CreatorLooksFeedPage() {
  const { addItem } = useCartStore();
  const { user } = useAuthStore();

  const [looks, setLooks] = useState<CreatorLook[]>([]);
  const [productsMap, setProductsMap] = useState<{ [id: number]: Product }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadFeed() {
      try {
        const looksRes = await api.get('/ugc/looks');
        setLooks(Array.isArray(looksRes.data) ? looksRes.data : []);

        const prodRes = await api.get('/products');
        const prods = Array.isArray(prodRes.data) ? prodRes.data : [];
        const pMap: { [id: number]: Product } = {};
        prods.forEach((p) => {
          pMap[p.id] = p;
        });
        setProductsMap(pMap);
      } catch {
        toast.error('Failed to load creator looks feed');
      } finally {
        setLoading(false);
      }
    }
    loadFeed();
  }, []);

  const handleShopProduct = async (lookId: number, product: Product) => {
    const visitorId = user ? String(user.id) : `visitor_${Math.random().toString(36).substring(2, 10)}`;

    try {
      await api.post(`/ugc/looks/${lookId}/click`, {
        productId: product.id,
        visitorId,
      });

      addItem({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        image: product.image || '',
        maxStock: product.stock ?? 99,
        quantity: 1,
      });

      toast.success(`Added ${product.name} to cart! Referral tracked.`);
    } catch {
      toast.error('Failed to process referral click');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold font-playfair flex items-center justify-center gap-2">
            ✨ Shop the Look
          </h1>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            Get styling and beauty inspiration directly from our creators and shop their exact product selections.
          </p>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse text-xs">
            Loading looks...
          </div>
        ) : looks.length === 0 ? (
          <div className="text-center py-20 text-xs text-muted-foreground italic">
            No creator looks posted yet. Be the first to share!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {(Array.isArray(looks) ? looks : []).map((look) => (
              <div
                key={look.id}
                className="bg-card border border-border/40 rounded-3xl overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
              >
                <div className="relative aspect-square w-full overflow-hidden">
                  <img
                    src={look.imageUrl}
                    alt={look.title}
                    className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 text-white">
                    <h3 className="text-sm font-bold font-playfair">{look.title}</h3>
                  </div>
                </div>

                <div className="p-5 flex-grow flex flex-col justify-between space-y-6">
                  <div className="flex items-center gap-2 border-b border-border/40 pb-3">
                    {look.user?.avatar ? (
                      <img
                        src={look.user.avatar}
                        alt={look.user.name}
                        className="w-6 h-6 rounded-full object-cover"
                      />
                    ) : (
                      <div className="p-1 bg-secondary rounded-full">
                        <User size={12} className="text-muted-foreground" />
                      </div>
                    )}
                    <span className="text-xs font-semibold text-muted-foreground">
                      @{look.user?.name || 'anonymous'}
                    </span>
                  </div>

                  <div className="space-y-3">
                    <p className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground flex items-center gap-1">
                      <Tag size={10} /> Tagged Products
                    </p>
                    <div className="space-y-2">
                      {(Array.isArray(look.taggedProductIds) ? look.taggedProductIds : []).map((prodId) => {
                        const product = productsMap[prodId];
                        if (!product) return null;
                        return (
                          <div
                            key={prodId}
                            className="flex items-center justify-between p-2.5 bg-secondary/15 rounded-2xl border border-border/15"
                          >
                            <div className="truncate max-w-[150px]">
                              <p className="text-[11px] font-semibold truncate">{product.name}</p>
                              <p className="text-[9px] font-mono text-primary font-bold">
                                ₹{product.price}
                              </p>
                            </div>
                            <button
                              onClick={() => handleShopProduct(look.id, product)}
                              className="px-3 py-1.5 bg-primary hover:bg-primary/95 text-white text-[9px] font-bold rounded-full flex items-center gap-1 shadow-sm hover:scale-[1.02] transition-all cursor-pointer"
                            >
                              Shop Look
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
