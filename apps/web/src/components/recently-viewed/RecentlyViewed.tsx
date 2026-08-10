'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { ProductCard } from '../products/ProductCard';

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

interface RecentlyViewedProps {
  productId?: number;
}

export function RecentlyViewed({ productId }: RecentlyViewedProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const trackAndFetch = async () => {
      try {
        const token = localStorage.getItem('token');
        const sessionId = localStorage.getItem('guest_chat_room_id') || 'default';
        const headers = {
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          'x-session-id': sessionId,
        };

        // 1. If currently viewing a product, track it on the backend
        if (productId) {
          await api.post(`/recently-viewed/${productId}`, {}, { headers });
        }

        // 2. Fetch recently viewed list
        const res = await api.get('/recently-viewed', { headers });
        const list = Array.isArray(res.data) ? res.data : [];
        
        // Filter out current product
        setProducts(list.filter((p: Product) => p.id !== productId));
      } catch (err) {
        console.error('Failed to manage recently viewed:', err);
      } finally {
        setLoading(false);
      }
    };

    trackAndFetch();
  }, [productId]);

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-6 w-48 bg-secondary/20 animate-pulse rounded-lg mb-4" />
        <div className="flex gap-4 overflow-x-auto pb-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="w-[200px] shrink-0 space-y-3">
              <div className="aspect-square bg-secondary/20 animate-pulse rounded-2xl" />
              <div className="h-4 bg-secondary/20 animate-pulse rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (products.length === 0) return null;

  return (
    <div className="py-12 border-t border-border/40">
      <h2 className="text-2xl font-playfair font-bold text-foreground mb-8">
        Recently Viewed
      </h2>
      <div className="flex gap-6 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-border/50 scrollbar-track-transparent">
        {products.map((product) => (
          <div key={product.id} className="w-[230px] shrink-0">
            <ProductCard product={product} />
          </div>
        ))}
      </div>
    </div>
  );
}
