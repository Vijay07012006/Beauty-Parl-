'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { useWishlistStore, WishlistItem } from '@/store/wishlistStore';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export default function WishlistPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { user } = useAuthStore();
  const { items, loadFromApi, removeItem, removeFromApi, synced } = useWishlistStore();
  const { addItem } = useCartStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (user && !synced) {
      loadFromApi();
    }
  }, [user, synced, loadFromApi]);

  const handleRemove = async (item: WishlistItem) => {
    if (user) {
      try {
        await removeFromApi(item.id);
        toast.success('Removed from wishlist');
      } catch {
        toast.error('Failed to remove. Try again.');
      }
    } else {
      removeItem(item.id);
      toast.success('Removed from wishlist');
    }
  };

  const handleAddToCart = (item: WishlistItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: item.id,
      name: item.name,
      price: Number(item.price),
      image: item.image,
      maxStock: item.stock,
      quantity: 1,
    });
    toast.success(`🛒 ${item.name} added to cart!`);
  };

  // Don't render until client-side (avoids hydration mismatch with persisted store)
  if (!mounted) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-6xl">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="animate-pulse bg-card rounded-3xl h-72" />
              ))}
            </div>
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
        <div className="container mx-auto px-4 max-w-6xl">
          {/* Page Header */}
          <div className="flex items-center justify-between mb-10">
            <div>
              <h1 className="text-4xl font-playfair font-bold">My Wishlist</h1>
              <p className="text-muted-foreground text-sm mt-1">Your favorite beauty collection</p>
            </div>
            <span className="text-sm text-muted-foreground bg-card border border-border/50 px-4 py-2 rounded-full">
              {items.length} {items.length === 1 ? 'item' : 'items'}
            </span>
          </div>

          {/* Empty State */}
          {items.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-md mx-auto text-center py-20 px-6 bg-card rounded-3xl border border-border/50 space-y-6"
            >
              <span className="text-6xl block select-none">❤️</span>
              <h3 className="text-2xl font-playfair font-bold">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground">
                Browse our curated products catalog and save your favorites here.
              </p>
              {!user && (
                <p className="text-xs text-primary/80 bg-primary/5 border border-primary/20 rounded-xl p-3">
                  💡 <Link href={`/${locale}/auth/login`} className="underline font-semibold">Sign in</Link> to save your wishlist across devices
                </p>
              )}
              <Link
                href={`/${locale}/products`}
                className="inline-block px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-all shadow-md shadow-primary/25"
              >
                Explore Products
              </Link>
            </motion.div>
          ) : (
            <>
              {!user && (
                <div className="mb-6 text-xs text-primary/80 bg-primary/5 border border-primary/20 rounded-xl p-4 text-center">
                  💡 <Link href={`/${locale}/auth/login`} className="underline font-semibold">Sign in</Link> to sync your wishlist across all your devices
                </div>
              )}
              <AnimatePresence>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                  {items.map((item, i) => (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: i * 0.04 }}
                      className="group bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
                    >
                      <Link href={`/${locale}/product/${item.id}`} className="flex flex-col h-full">
                        {/* Image */}
                        <div className="relative aspect-square w-full bg-secondary/10 overflow-hidden">
                          {item.image ? (
                            <Image
                              src={item.image}
                              alt={item.name}
                              fill
                              sizes="(max-width: 640px) 50vw, 25vw"
                              className="object-cover transition-transform duration-500 group-hover:scale-110"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl">💄</div>
                          )}
                          {/* Remove button */}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleRemove(item);
                            }}
                            className="absolute top-2 right-2 p-1.5 bg-white/90 hover:bg-red-50 border border-red-100 rounded-full text-red-500 hover:text-red-600 transition-all hover:scale-110 active:scale-95 opacity-0 group-hover:opacity-100 shadow-md"
                            aria-label="Remove from wishlist"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                              <path d="M18 6 6 18M6 6l12 12" />
                            </svg>
                          </button>

                          {/* Out of stock badge */}
                          {item.stock <= 0 && (
                            <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                              <span className="text-xs font-bold text-red-600 bg-white px-3 py-1 rounded-full border border-red-200">Out of Stock</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                          <div>
                            <h3 className="font-semibold text-sm line-clamp-1 group-hover:text-primary transition-colors">{item.name}</h3>
                            <div className="flex items-baseline gap-2 mt-1">
                              <span className="text-primary font-bold text-sm">${Number(item.price).toFixed(2)}</span>
                              {item.mrp && Number(item.mrp) > Number(item.price) && (
                                <span className="text-xs text-muted-foreground line-through">${Number(item.mrp).toFixed(2)}</span>
                              )}
                            </div>
                          </div>

                          {/* Add to Cart */}
                          <button
                            onClick={(e) => handleAddToCart(item, e)}
                            disabled={item.stock <= 0}
                            className="w-full py-2 text-xs font-bold bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer"
                          >
                            Add to Cart
                          </button>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
                </div>
              </AnimatePresence>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
