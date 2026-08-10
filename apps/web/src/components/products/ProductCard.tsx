'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { RatingStars } from './RatingStars';
import { PriceDisplay } from './PriceDisplay';
import { WishlistButton } from './WishlistButton';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { useState, useEffect } from 'react';
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

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCartStore();
  const locale = useLocale();
  const [isComparing, setIsComparing] = useState(false);

  useEffect(() => {
    const local = localStorage.getItem('comparison_ids');
    if (local) {
      try {
        const ids = JSON.parse(local) as number[];
        setIsComparing(ids.includes(product.id));
      } catch {}
    }
  }, [product.id]);

  const handleCompareToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const checked = !isComparing;
    setIsComparing(checked);

    const local = localStorage.getItem('comparison_ids');
    let ids: number[] = [];
    if (local) {
      try {
        ids = JSON.parse(local);
      } catch {}
    }

    if (checked) {
      if (ids.length >= 4) {
        toast.error('You can compare a maximum of 4 products.');
        setIsComparing(false);
        return;
      }
      ids = [...ids, product.id];
    } else {
      ids = ids.filter((id) => id !== product.id);
    }

    localStorage.setItem('comparison_ids', JSON.stringify(ids));

    try {
      const token = localStorage.getItem('token');
      const sessionId = localStorage.getItem('guest_chat_room_id') || 'default';
      const headers = {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        'x-session-id': sessionId,
      };

      if (checked) {
        await api.post(`/comparison/add/${product.id}`, {}, { headers });
        toast.success(`Added ${product.name} to comparison!`);
      } else {
        await api.delete(`/comparison/remove/${product.id}`, { headers });
        toast.success(`Removed ${product.name} from comparison`);
      }
    } catch {}
  };

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      maxStock: product.stock,
      quantity: 1,
    });
    
    toast.success(`🛒 Added ${product.name} to cart!`);
  };

  return (
    <Link href={`/${locale}/product/${product.id}`} className="group block">
      <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col h-full relative">
        {/* Compare Checkbox Overlay */}
        <div 
          onClick={handleCompareToggle}
          className="absolute top-4 left-4 z-10 bg-white/70 backdrop-blur-md px-2.5 py-1 rounded-full border border-border/30 hover:bg-white transition flex items-center gap-1.5 shadow-sm cursor-pointer"
        >
          <input
            type="checkbox"
            checked={isComparing}
            readOnly
            className="w-3.5 h-3.5 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
          />
          <span className="text-[10px] font-bold text-foreground select-none">Compare</span>
        </div>

        {/* Wishlist Button Overlay */}
        <div className="absolute top-4 right-4 z-10">
          <WishlistButton
            item={{
              id: product.id,
              name: product.name,
              price: Number(product.price),
              mrp: product.mrp ? Number(product.mrp) : undefined,
              discountPercent: product.discountPercent,
              image: product.image,
              rating: product.rating,
              ratingCount: product.ratingCount,
              stock: product.stock
            }}
          />
        </div>

        {/* Product Image Wrapper */}
        <div className="relative aspect-square w-full bg-secondary/10 overflow-hidden">
          {product.image ? (
            <Image
              src={product.image}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-500 group-hover:scale-110"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-5xl">💄</div>
          )}
          
          {/* Out of Stock Overlay */}
          {product.stock <= 0 && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
              <span className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="p-5 flex-1 flex flex-col justify-between space-y-3">
          <div className="space-y-1">
            {product.brand && (
              <span className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                {product.brand}
              </span>
            )}
            <h3 className="font-playfair font-bold text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
              {product.name}
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">
              {product.description}
            </p>
          </div>

          <div className="space-y-2">
            {/* Rating */}
            {product.rating !== undefined && (
              <RatingStars rating={product.rating} count={product.ratingCount} />
            )}

            {/* Price & Cart CTA */}
            <div className="flex items-center justify-between pt-1">
              <PriceDisplay
                price={product.price}
                mrp={product.mrp}
                discountPercent={product.discountPercent}
                size="sm"
              />
              
              <button
                onClick={handleAddToCart}
                disabled={product.stock <= 0}
                className="p-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full transition-all active:scale-95 disabled:opacity-50 disabled:bg-secondary disabled:text-muted-foreground cursor-pointer"
                aria-label="Add to Cart"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4"
                >
                  <circle cx="8" cy="21" r="1" />
                  <circle cx="19" cy="21" r="1" />
                  <path d="M2.05 2.05h2l2.66 12.42a2 2 0 0 0 2 1.58h9.78a2 2 0 0 0 1.95-1.57l1.65-7.43H5.12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
