'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { api } from '@/lib/api';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { ShoppingBag, Star } from 'lucide-react';
import Link from 'next/link';

interface Product {
  id: number;
  name: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  image?: string;
  category?: string;
  rating: number;
  ratingCount: number;
  stock: number;
}

interface RecommendationsSectionProps {
  type: 'also-bought' | 'similar' | 'personalized';
  productId?: number;
  limit?: number;
}

export function RecommendationsSection({
  type,
  productId,
  limit = 4,
}: RecommendationsSectionProps) {
  const t = useTranslations('products');
  const params = useParams();
  const locale = params.locale || 'en';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((state) => state.addItem);

  useEffect(() => {
    async function fetchRecommendations() {
      try {
        setLoading(true);
        let endpoint = `/recommendations/${type}?limit=${limit}`;
        if (productId) {
          endpoint += `&productId=${productId}`;
        }
        
        // Fetch from API
        // Auth is carried by the HttpOnly bp_token cookie sent via withCredentials
        const res = await api.get(endpoint);
        setProducts(res.data);
      } catch (err) {
        console.error('Failed to load recommendations:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchRecommendations();
  }, [type, productId, limit]);

  const handleAddToCart = (e: React.MouseEvent, product: Product) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image || '',
      maxStock: product.stock,
    });
    toast.success(`${product.name} added to cart!`);
  };

  const getSectionTitle = () => {
    try {
      if (type === 'also-bought') return t('customers_also_bought');
      if (type === 'similar') return t('complete_your_look');
      return t('recommended_for_you');
    } catch {
      // Fallbacks in case translation keys are missing in some languages
      if (type === 'also-bought') return 'Customers Also Bought';
      if (type === 'similar') return 'Complete Your Look';
      return 'Recommended for You';
    }
  };

  if (loading) {
    return (
      <div className="py-8">
        <div className="h-8 w-64 bg-secondary/20 animate-pulse rounded-lg mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[...Array(limit)].map((_, i) => (
            <div key={i} className="space-y-4">
              <div className="aspect-square bg-secondary/20 animate-pulse rounded-2xl" />
              <div className="h-4 w-3/4 bg-secondary/20 animate-pulse rounded" />
              <div className="h-4 w-1/2 bg-secondary/20 animate-pulse rounded" />
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
        {getSectionTitle()}
      </h2>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {products.map((product) => (
          <Link
            key={product.id}
            href={`/${locale}/product/${product.id}`}
            className="group block bg-card/40 backdrop-blur-md border border-border/30 rounded-2xl p-4 hover:border-primary/40 transition-all duration-300 hover:shadow-lg"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary/10 mb-4">
              {product.image ? (
                <img
                  src={product.image}
                  alt={product.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  loading="lazy"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  No Image
                </div>
              )}
              {product.discountPercent && product.discountPercent > 0 ? (
                <div className="absolute top-2 left-2 bg-primary/95 text-white text-xs font-bold px-2 py-1 rounded-full">
                  -{product.discountPercent}%
                </div>
              ) : null}
            </div>

            <h3 className="font-semibold text-foreground text-sm line-clamp-1 group-hover:text-primary transition">
              {product.name}
            </h3>

            <div className="flex items-center gap-1 mt-1 mb-2">
              <Star className="w-3.5 h-3.5 fill-amber-400 stroke-amber-400" />
              <span className="text-xs font-medium text-foreground/80">{product.rating}</span>
              <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div>
                <span className="font-bold text-foreground text-sm">
                  Rs. {Number(product.price).toFixed(2)}
                </span>
                {product.mrp && Number(product.mrp) > Number(product.price) ? (
                  <span className="text-xs text-muted-foreground line-through ml-2">
                    Rs. {Number(product.mrp).toFixed(2)}
                  </span>
                ) : null}
              </div>

              <button
                onClick={(e) => handleAddToCart(e, product)}
                disabled={product.stock <= 0}
                className="p-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ShoppingBag className="w-4 h-4" />
              </button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
