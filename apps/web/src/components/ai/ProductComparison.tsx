'use client';

import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

export interface ComparisonProduct {
  id: number | string;
  name: string;
  price: number | string;
  image?: string;
  rating?: number;
  stock?: number;
  category?: string;
  description?: string;
}

interface ProductComparisonProps {
  products: ComparisonProduct[];
}

export function ProductComparison({ products }: ProductComparisonProps) {
  const { addItem } = useCartStore();

  const handleQuickAdd = (product: ComparisonProduct) => {
    addItem({
      id: Number(product.id),
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image || '',
      maxStock: product.stock ?? 99,
      quantity: 1,
    });
    toast.success(`🛒 Added ${product.name} to cart!`);
  };

  if (!products || products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-muted-foreground">
        <p className="text-sm">No products selected for comparison.</p>
      </div>
    );
  }

  return (
    <div className="w-full flex flex-col gap-4">
      <div className="shrink-0 flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Product Comparison</p>
        <p className="text-[10px] text-muted-foreground">Comparing {products.length} items</p>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border/50 bg-card">
        <table className="w-full border-collapse text-xs">
          <thead>
            <tr className="bg-secondary/30">
              <th className="p-3 text-left font-semibold text-muted-foreground w-28">Specification</th>
              {products.map((p) => (
                <th key={p.id} className="p-3 text-center font-semibold border-l border-border/30 min-w-[120px]">
                  <div className="flex flex-col items-center gap-1.5">
                    {p.image ? (
                      <img src={p.image} alt={p.name} className="w-14 h-14 object-cover rounded-xl border border-border/30 bg-secondary/10" />
                    ) : (
                      <div className="w-14 h-14 bg-secondary/20 rounded-xl border border-border/30 flex items-center justify-center text-muted-foreground/30">💄</div>
                    )}
                    <span className="font-bold line-clamp-1 text-[11px] text-foreground">{p.name}</span>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {/* Price */}
            <tr className="border-t border-border/30 hover:bg-secondary/5 transition">
              <td className="p-3 font-semibold text-muted-foreground">Price</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center border-l border-border/30 text-primary font-bold">
                  ₹{Number(p.price).toFixed(2)}
                </td>
              ))}
            </tr>

            {/* Rating */}
            <tr className="border-t border-border/30 hover:bg-secondary/5 transition">
              <td className="p-3 font-semibold text-muted-foreground">Rating</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center border-l border-border/30">
                  {p.rating ? `⭐ ${p.rating.toFixed(1)}` : '—'}
                </td>
              ))}
            </tr>

            {/* Category */}
            <tr className="border-t border-border/30 hover:bg-secondary/5 transition">
              <td className="p-3 font-semibold text-muted-foreground">Category</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center border-l border-border/30 capitalize">
                  {p.category || '—'}
                </td>
              ))}
            </tr>

            {/* Availability */}
            <tr className="border-t border-border/30 hover:bg-secondary/5 transition">
              <td className="p-3 font-semibold text-muted-foreground">Availability</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center border-l border-border/30">
                  {p.stock !== undefined ? (
                    p.stock > 0 ? (
                      <span className="text-emerald-600 font-medium">In Stock ({p.stock})</span>
                    ) : (
                      <span className="text-red-500 font-medium">Out of Stock</span>
                    )
                  ) : (
                    '—'
                  )}
                </td>
              ))}
            </tr>

            {/* Action */}
            <tr className="border-t border-border/30">
              <td className="p-3 font-semibold text-muted-foreground">Actions</td>
              {products.map((p) => (
                <td key={p.id} className="p-3 text-center border-l border-border/30">
                  <button
                    onClick={() => handleQuickAdd(p)}
                    disabled={p.stock !== undefined && p.stock <= 0}
                    className="px-2.5 py-1 bg-primary text-white rounded-lg text-[10px] font-bold hover:bg-primary/95 transition shadow-sm disabled:opacity-40 cursor-pointer flex items-center justify-center gap-1 mx-auto"
                  >
                    <ShoppingCart className="w-3 h-3" />
                    <span>Add</span>
                  </button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
