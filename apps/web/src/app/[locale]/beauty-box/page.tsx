'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { useCartStore } from '@/store/cartStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import { Sparkles, ShoppingCart, Info, Calendar } from 'lucide-react';
import Link from 'next/link';

interface BeautyBox {
  id: number;
  name: string;
  description?: string;
  price: number;
  imageUrl?: string;
  items: Array<{ name: string; size?: string }>;
}

export default function BeautyBoxesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const { addItem } = useCartStore();
  const [boxes, setBoxes] = useState<BeautyBox[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBoxes();
  }, []);

  const fetchBoxes = async () => {
    try {
      const res = await api.get('/beauty-boxes');
      setBoxes(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load beauty boxes:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribe = (box: BeautyBox, frequency: 'monthly' | 'bi-monthly') => {
    if (!user) {
      toast.error('Please sign in to subscribe to beauty boxes');
      router.push(`/${locale}/auth/login`);
      return;
    }

    // Add to cart as a recurring subscription item
    addItem({
      id: box.id + 10000, // offset to avoid clash with catalog IDs
      name: `${box.name} (${frequency})`,
      price: Number(box.price),
      image: box.imageUrl || '',
      maxStock: 99,
      quantity: 1,
    });

    toast.success(`🌸 Subscribed to ${box.name}! Auto-delivery added to cart.`);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading discovery boxes...</span>
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
        <div className="container mx-auto px-4 max-w-5xl space-y-10">
          <div className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 bg-primary/10 text-primary font-bold px-3 py-1 rounded-full text-[10px] uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" /> Curated Beauty Collections
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">Discovery Boxes</h1>
            <p className="text-muted-foreground text-xs max-w-md mx-auto">
              Subscribe to thematic monthly packages containing deluxe trial cosmetics, skincare treatments, and styles selected by our beauticians.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {boxes.map((box) => (
              <motion.div
                key={box.id}
                whileHover={{ y: -4 }}
                className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between"
              >
                <div className="space-y-4">
                  <div className="aspect-[16/9] w-full bg-secondary/20 relative overflow-hidden">
                    {box.imageUrl ? (
                      <img src={box.imageUrl} alt={box.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">🎁</div>
                    )}
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-start">
                      <h3 className="text-xl font-playfair font-bold text-foreground">{box.name}</h3>
                      <span className="text-lg font-bold text-primary">Rs. {Number(box.price).toFixed(2)}</span>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">{box.description}</p>

                    <div className="space-y-2 pt-2">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Info className="w-3.5 h-3.5" /> What's Inside:
                      </span>
                      <ul className="grid grid-cols-1 gap-2 pl-1">
                        {box.items.map((item, idx) => (
                          <li key={idx} className="text-xs text-foreground flex justify-between border-b border-border/10 pb-1">
                            <span>✨ {item.name}</span>
                            <span className="text-muted-foreground font-semibold text-[10px]">{item.size || 'Full Size'}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleSubscribe(box, 'monthly')}
                    className="py-2.5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" /> Monthly
                  </button>
                  <button
                    onClick={() => handleSubscribe(box, 'bi-monthly')}
                    className="py-2.5 bg-neutral-900 text-white rounded-xl font-bold text-xs hover:bg-neutral-850 transition flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Calendar className="w-4 h-4" /> Bi-Monthly
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
