'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Tag, Zap, Clock, ShoppingCart } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: string;
  stock: number;
  images?: string[];
  description?: string;
}

interface FlashSale {
  id: number;
  name: string;
  description?: string;
  discountPercentage: number;
  startTime: string;
  endTime: string;
  products: Product[];
}

export default function FlashSalePage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [sales, setSales] = useState<FlashSale[]>([]);
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const res = await api.get('/flash-sales/active');
      setSales(res.data);
    } catch (err) {
      console.error('Failed to load active flash sales:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timer = setInterval(() => {
      const newTimeLeft: { [key: number]: string } = {};
      sales.forEach((sale) => {
        const end = new Date(sale.endTime).getTime();
        const now = new Date().getTime();
        const diff = end - now;

        if (diff <= 0) {
          newTimeLeft[sale.id] = 'Expired';
        } else {
          const hours = Math.floor(diff / (1000 * 60 * 60));
          const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diff % (1000 * 60)) / 1000);
          newTimeLeft[sale.id] = `${hours.toString().padStart(2, '0')}:${minutes
            .toString()
            .padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }
      });
      setTimeLeft(newTimeLeft);
    }, 1000);

    return () => clearInterval(timer);
  }, [sales]);

  const handleAddToCart = async (product: Product, discountPercentage: number) => {
    try {
      await api.post('/cart/items', {
        productId: product.id,
        quantity: 1,
      });
      toast.success(`${product.name} added to cart! 🛍️`);
    } catch {
      toast.error('Failed to add item to cart');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading active flash sales...</span>
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
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/25 rounded-full text-xs font-bold text-primary animate-pulse">
              <Zap className="w-3.5 h-3.5 fill-primary" /> Active Flash Events
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
              Limited-Time Super Sales
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Grab your premium beauty supplies with direct flash discounts! Only while stocks last.
            </p>
          </div>

          {/* Sales List */}
          {sales.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border/40 rounded-3xl space-y-4">
              <Clock className="w-12 h-12 text-muted-foreground/60 mx-auto" />
              <h3 className="font-bold text-lg text-foreground">No Active Flash Sales Right Now</h3>
              <p className="text-xs text-muted-foreground">Check back later or subscribe to our newsletter for alert updates.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {sales.map((sale) => (
                <div key={sale.id} className="bg-card border border-border/50 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm">
                  {/* Sale Header */}
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border/20 pb-4">
                    <div className="space-y-1">
                      <h2 className="text-2xl font-playfair font-bold text-foreground flex items-center gap-2">
                        {sale.name}
                        <span className="text-xs bg-primary text-white font-bold px-2 py-0.5 rounded-md">
                          {sale.discountPercentage}% Off
                        </span>
                      </h2>
                      <p className="text-xs text-muted-foreground">{sale.description}</p>
                    </div>

                    <div className="flex items-center gap-3 bg-neutral-900 text-white px-4 py-2.5 rounded-2xl self-start md:self-auto font-mono text-sm shadow-md">
                      <Clock className="w-4 h-4 text-primary animate-spin" style={{ animationDuration: '3s' }} />
                      <span>Ends In:</span>
                      <span className="font-bold text-primary">{timeLeft[sale.id] || 'Calculating...'}</span>
                    </div>
                  </div>

                  {/* Product Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                    {sale.products.map((prod) => {
                      const originalPrice = parseFloat(prod.price);
                      const discountedPrice = originalPrice * (1 - sale.discountPercentage / 100);
                      const imageSrc = prod.images && prod.images.length > 0 ? prod.images[0] : 'https://placehold.co/300x300/e2e8f0/64748b?text=Beauty+Product';

                      return (
                        <div key={prod.id} className="bg-secondary/20 border border-border/30 rounded-2xl overflow-hidden flex flex-col justify-between hover:shadow-md transition">
                          <Link href={`/${locale}/products/${prod.id}`}>
                            <div className="relative aspect-square bg-white flex items-center justify-center p-4">
                              <img
                                src={imageSrc}
                                alt={prod.name}
                                className="max-h-full max-w-full object-contain"
                              />
                              <div className="absolute top-2 right-2 bg-primary text-white font-bold text-[10px] px-2 py-0.5 rounded-md flex items-center gap-0.5">
                                <Tag className="w-3 h-3" /> Save {sale.discountPercentage}%
                              </div>
                            </div>
                          </Link>

                          <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                            <div className="space-y-1">
                              <h4 className="font-bold text-xs text-foreground line-clamp-1">
                                {prod.name}
                              </h4>
                              <p className="text-[10px] text-muted-foreground line-clamp-2">
                                {prod.description || 'Premium selection.'}
                              </p>
                            </div>

                            <div className="space-y-3 pt-2">
                              {/* Prices */}
                              <div className="flex items-baseline gap-2">
                                <span className="text-sm font-bold font-mono text-primary">
                                  Rs. {discountedPrice.toFixed(2)}
                                </span>
                                <span className="text-[10px] line-through font-mono text-muted-foreground">
                                  Rs. {originalPrice.toFixed(2)}
                                </span>
                              </div>

                              {/* Stock status indicator */}
                              <div className="space-y-1">
                                <div className="flex justify-between text-[9px] font-bold text-muted-foreground">
                                  <span>Stock left</span>
                                  <span>{prod.stock} items</span>
                                </div>
                                <div className="h-1 bg-secondary rounded-full overflow-hidden">
                                  <div
                                    className="h-full bg-orange-500 rounded-full"
                                    style={{ width: `${Math.min(100, (prod.stock / 20) * 100)}%` }}
                                  />
                                </div>
                              </div>

                              <button
                                onClick={() => handleAddToCart(prod, sale.discountPercentage)}
                                className="w-full py-2 bg-primary text-white hover:bg-primary/95 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm shadow-primary/10"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" /> Buy Now
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
