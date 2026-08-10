'use client';

import Image from 'next/image';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { Sparkles, Plus, ShoppingCart } from 'lucide-react';
import { PriceDisplay } from './PriceDisplay';

interface Product {
  id: number;
  name: string;
  price: number;
  image: string;
  stock: number;
  brand?: string;
}

interface Bundle {
  id: number;
  name: string;
  description?: string;
  discountPercentage?: number;
  originalTotal: number;
  finalTotal: number;
  discountValue: number;
  products: Product[];
}

interface BundleCardProps {
  bundle: Bundle;
}

export function BundleCard({ bundle }: BundleCardProps) {
  const { addItem } = useCartStore();

  const handleAddBundleToCart = () => {
    if (!bundle.products || bundle.products.length === 0) return;

    let addedCount = 0;
    bundle.products.forEach((product) => {
      if (product.stock > 0) {
        // Calculate a proportional price for each item inside the bundle based on discount percentage
        const discountFactor = bundle.discountPercentage ? (1 - bundle.discountPercentage / 100) : 1;
        const itemPrice = Number((Number(product.price) * discountFactor).toFixed(2));
        
        addItem({
          id: product.id,
          name: product.name,
          price: itemPrice,
          image: product.image,
          maxStock: product.stock,
          quantity: 1,
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      toast.success(`🛒 Added bundle "${bundle.name}" to cart with ${bundle.discountPercentage}% savings!`);
    } else {
      toast.error('All products in this bundle are currently out of stock.');
    }
  };

  return (
    <div className="bg-card rounded-3xl border border-border/50 overflow-hidden shadow-md hover:shadow-lg transition-all duration-300 p-6 flex flex-col justify-between space-y-6 relative group">
      
      {/* Save Ribbon */}
      {bundle.discountPercentage && (
        <div className="absolute top-4 right-4 z-10 bg-rose-500 text-white text-[11px] font-bold px-3 py-1 rounded-full shadow-md flex items-center gap-1">
          <Sparkles className="w-3.5 h-3.5" />
          Save {bundle.discountPercentage}%
        </div>
      )}

      <div>
        <h3 className="font-playfair font-bold text-lg leading-snug group-hover:text-primary transition-colors">
          {bundle.name}
        </h3>
        {bundle.description && (
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
            {bundle.description}
          </p>
        )}
      </div>

      {/* Product list representation */}
      <div className="flex items-center gap-3 py-2 overflow-x-auto no-scrollbar">
        {bundle.products.map((product, idx) => (
          <div key={product.id} className="flex items-center">
            {idx > 0 && <Plus className="w-4 h-4 text-muted-foreground/60 mx-1.5 flex-shrink-0" />}
            <div className="relative w-16 h-16 rounded-2xl bg-secondary/15 border border-border/30 overflow-hidden group/item flex-shrink-0">
              <Image
                src={product.image}
                alt={product.name}
                fill
                sizes="64px"
                className="object-cover transition-transform group-hover/item:scale-110"
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-1">
        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Bundle price</span>
        <div className="flex items-baseline gap-2.5">
          <span className="text-2xl font-extrabold text-foreground">
            ${Number(bundle.finalTotal).toFixed(2)}
          </span>
          <span className="text-sm text-muted-foreground line-through decoration-rose-500/65">
            ${Number(bundle.originalTotal).toFixed(2)}
          </span>
        </div>
      </div>

      <button
        onClick={handleAddBundleToCart}
        className="w-full bg-primary hover:bg-primary/95 text-white py-3 px-4 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all active:scale-98 shadow-sm cursor-pointer"
      >
        <ShoppingCart className="w-4 h-4" />
        Add Bundle to Cart
      </button>
    </div>
  );
}
