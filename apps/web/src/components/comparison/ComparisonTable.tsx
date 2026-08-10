'use client';

import { useTranslations } from 'next-intl';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Star, Trash2 } from 'lucide-react';

interface Product {
  id: number;
  name: string;
  price: number;
  mrp?: number;
  brand?: string;
  category?: string;
  rating?: number;
  ratingCount?: number;
  stock: number;
  image?: string;
}

interface ComparisonTableProps {
  products: Product[];
  differences: {
    brand?: boolean;
    category?: boolean;
    price?: boolean;
    rating?: boolean;
  };
  onRemove: (id: number) => void;
}

export function ComparisonTable({ products, differences, onRemove }: ComparisonTableProps) {
  const params = useParams();
  const locale = params.locale || 'en';

  if (products.length === 0) {
    return (
      <div className="text-center py-16 bg-card/40 backdrop-blur-md rounded-3xl border border-border/30">
        <p className="text-muted-foreground text-sm">Add products from listing pages to begin comparing details side-by-side!</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto bg-card/30 backdrop-blur-md rounded-3xl border border-border/30 shadow-lg">
      <table className="w-full text-left border-collapse min-w-[600px]">
        <thead>
          <tr className="border-b border-border/30">
            <th className="p-4 text-xs font-bold text-muted-foreground uppercase tracking-wider w-1/5">Features</th>
            {products.map((product) => (
              <th key={product.id} className="p-4 w-1/4 min-w-[150px] relative group">
                <div className="space-y-3">
                  <div className="relative aspect-square w-full rounded-2xl overflow-hidden bg-secondary/10">
                    {product.image ? (
                      <img src={product.image} alt={product.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-3xl">💄</div>
                    )}
                  </div>
                  <Link href={`/${locale}/product/${product.id}`} className="block font-semibold text-sm hover:text-primary transition line-clamp-2">
                    {product.name}
                  </Link>
                  <button
                    onClick={() => onRemove(product.id)}
                    className="flex items-center gap-1 text-[11px] font-semibold text-red-500 hover:text-red-700 transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" /> Remove
                  </button>
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-border/20 text-sm">
          {/* Brand */}
          <tr className={differences.brand ? 'bg-primary/5 font-medium' : ''}>
            <td className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wide">Brand</td>
            {products.map((product) => (
              <td key={product.id} className="p-4">{product.brand || 'Beauty Parlé'}</td>
            ))}
          </tr>

          {/* Category */}
          <tr className={differences.category ? 'bg-primary/5 font-medium' : ''}>
            <td className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wide">Category</td>
            {products.map((product) => (
              <td key={product.id} className="p-4">{product.category || 'Cosmetics'}</td>
            ))}
          </tr>

          {/* Price */}
          <tr className={differences.price ? 'bg-primary/5 font-medium' : ''}>
            <td className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wide">Price</td>
            {products.map((product) => (
              <td key={product.id} className="p-4 font-bold">Rs. {Number(product.price).toFixed(2)}</td>
            ))}
          </tr>

          {/* Rating */}
          <tr className={differences.rating ? 'bg-primary/5 font-medium' : ''}>
            <td className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wide">Rating</td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 stroke-amber-400" />
                  <span>{product.rating || 'N/A'}</span>
                  {product.ratingCount !== undefined && (
                    <span className="text-xs text-muted-foreground">({product.ratingCount})</span>
                  )}
                </div>
              </td>
            ))}
          </tr>

          {/* Stock Availability */}
          <tr>
            <td className="p-4 font-bold text-muted-foreground text-xs uppercase tracking-wide">Stock Availability</td>
            {products.map((product) => (
              <td key={product.id} className="p-4">
                <span className={`font-semibold ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
                  {product.stock > 0 ? `In Stock (${product.stock})` : 'Out of Stock'}
                </span>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
