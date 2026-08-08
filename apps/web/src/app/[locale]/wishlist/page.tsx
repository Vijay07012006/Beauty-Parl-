'use client';

import { useWishlistStore } from '@/store/wishlistStore';
import { ProductCard } from '@/components/products/ProductCard';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Link from 'next/link';

export default function WishlistPage() {
  const { items } = useWishlistStore();

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-playfair font-bold text-center mb-2">My Wishlist</h1>
          <p className="text-muted-foreground text-center mb-10">Your favorite beauty collection</p>

          {items.length === 0 ? (
            <div className="max-w-md mx-auto text-center py-16 px-6 bg-card rounded-3xl border border-border/50 space-y-6">
              <span className="text-6xl block select-none">❤️</span>
              <h3 className="text-xl font-bold">Your wishlist is empty</h3>
              <p className="text-sm text-muted-foreground">
                Browse our curated products catalog and save your favorites here.
              </p>
              <Link
                href="/en/products"
                className="inline-block px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/90 transition-colors shadow-md shadow-primary/25 cursor-pointer"
              >
                Explore Products
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {items.map((item) => (
                <ProductCard
                  key={item.id}
                  product={{
                    id: item.id,
                    name: item.name,
                    price: Number(item.price),
                    mrp: item.mrp,
                    discountPercent: item.discountPercent,
                    image: item.image,
                    category: '',
                    description: '',
                    stock: item.stock,
                    rating: item.rating,
                    ratingCount: item.ratingCount
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
