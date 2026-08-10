'use client';

import { useState, useEffect, use } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { Sparkles, ShoppingBag, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useLocale } from '@/hooks/useLocale';

interface Product {
  id: number;
  name: string;
  brand?: string;
  description: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  image: string;
  category: string;
  stock: number;
  rating?: number;
  ratingCount?: number;
}

interface LookDetail {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  occasion?: string;
  skinType?: string;
  products: Product[];
}

interface Params {
  slug: string;
}

export default function LookDetailPage({ params }: { params: Promise<Params> }) {
  const { slug } = use(params);
  const locale = useLocale();
  const [look, setLook] = useState<LookDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const { addItem } = useCartStore();

  useEffect(() => {
    async function fetchLook() {
      try {
        const res = await api.get(`/looks/${slug}`);
        setLook(res.data);
      } catch (err) {
        console.error('Error fetching look detail:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLook();
  }, [slug]);

  const handleAddAllToCart = () => {
    if (!look || !look.products || look.products.length === 0) return;

    let addedCount = 0;
    look.products.forEach((product) => {
      if (product.stock > 0) {
        addItem({
          id: product.id,
          name: product.name,
          price: Number(product.price),
          image: product.image,
          maxStock: product.stock,
          quantity: 1,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`🛒 Added all ${addedCount} products from "${look.name}" to cart!`);
    } else {
      toast.error('All products in this look are currently out of stock.');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
        </div>
        <Footer />
      </>
    );
  }

  if (!look) {
    return (
      <>
        <Header />
        <div className="min-h-screen flex flex-col items-center justify-center space-y-4">
          <h1 className="text-2xl font-bold">Look not found</h1>
          <Link href={`/${locale}/looks`} className="text-primary hover:underline flex items-center gap-1">
            <ArrowLeft className="w-4 h-4" /> Back to Looks
          </Link>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background pb-20">
        
        {/* Banner Section */}
        <div className="relative h-[280px] sm:h-[360px] md:h-[450px] w-full bg-neutral-900 overflow-hidden">
          {look.imageUrl && (
            <Image
              src={look.imageUrl}
              alt={look.name}
              fill
              priority
              className="object-cover opacity-60"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
          
          {/* Breadcrumb / Back Button */}
          <div className="absolute top-8 left-4 md:left-8 z-20">
            <Link 
              href={`/${locale}/looks`} 
              className="inline-flex items-center gap-2 px-4 py-2 bg-background/80 backdrop-blur-md hover:bg-background text-foreground text-xs font-bold rounded-full transition shadow-md border border-border/20"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Looks
            </Link>
          </div>

          {/* Banner content */}
          <div className="absolute bottom-12 left-4 md:left-12 max-w-2xl text-white space-y-4">
            {look.occasion && (
              <span className="inline-flex items-center gap-1 px-3 py-1 bg-primary text-white text-[10px] font-bold rounded-full tracking-wider uppercase shadow-md">
                <Sparkles className="w-3 h-3" />
                {look.occasion}
              </span>
            )}
            <h1 className="text-4xl md:text-5xl font-playfair font-black drop-shadow-md text-foreground">
              {look.name}
            </h1>
            {look.description && (
              <p className="text-sm text-foreground/80 leading-relaxed font-medium drop-shadow-sm">
                {look.description}
              </p>
            )}
            {look.skinType && (
              <div className="inline-block text-[11px] font-bold bg-white/20 backdrop-blur-md px-3 py-1 rounded-lg">
                Best for Skin Type: <span className="underline decoration-pink-400">{look.skinType}</span>
              </div>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="container mx-auto px-4 max-w-6xl mt-12 space-y-12">
          
          {/* Action Bar */}
          <div className="flex flex-col md:flex-row items-center justify-between bg-card p-6 rounded-3xl border border-border/50 shadow-sm gap-4">
            <div>
              <h2 className="font-playfair font-bold text-xl">Get the Complete Routine</h2>
              <p className="text-xs text-muted-foreground mt-1">Get every matching item selected for this aesthetic.</p>
            </div>
            <button
              onClick={handleAddAllToCart}
              className="bg-primary hover:bg-primary/95 text-white py-3.5 px-8 rounded-2xl font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-primary/10 active:scale-98 cursor-pointer select-none"
            >
              <ShoppingBag className="w-4 h-4" />
              Add Entire Look to Cart
            </button>
          </div>

          {/* Products Grid */}
          <div className="space-y-6">
            <h3 className="font-playfair font-bold text-2xl tracking-tight">Included Products</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {look.products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
