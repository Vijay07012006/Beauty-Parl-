'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { SvgChart } from './SvgChart';
import {
  ShoppingCart, Star, X, Package, TrendingUp, Table as TableIcon,
  Search, Image as ImageIcon, ChevronLeft, ChevronRight, ExternalLink,
  Plus, Minus, Check
} from 'lucide-react';
import { toast } from 'sonner';

// ─── Types ───────────────────────────────────────────────────────────────────

const formatPrice = (price: any): string => {
  const num = Number(price);
  return isNaN(num) ? '0.00' : num.toFixed(2);
};

export interface VisualProduct {
  id: number | string;
  name: string;
  price: number | string;
  image?: string;
  rating?: number;
  category?: string;
  description?: string;
  stock?: number;
}

export interface VisualChart {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labels: string[];
  values: number[];
}

export interface ComparisonRow {
  [key: string]: string | number;
}

export interface VisualContent {
  visualType: 'products' | 'chart' | 'comparison' | 'web_search' | 'image' | 'empty';
  products?: VisualProduct[];
  chart?: VisualChart;
  comparison?: { headers: string[]; rows: ComparisonRow[] };
  webSearch?: { title: string; url: string; snippet: string }[];
  imageUrl?: string;
  imagePrompt?: string;
}

// ─── Star Rating ─────────────────────────────────────────────────────────────

function StarRating({ value = 0 }: { value?: number }) {
  const stars = Math.min(5, Math.max(0, Math.round(value)));
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-3 h-3 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/25'}`}
        />
      ))}
      {value > 0 && <span className="text-[10px] text-muted-foreground ml-1">({value.toFixed(1)})</span>}
    </div>
  );
}

// ─── Product Modal ────────────────────────────────────────────────────────────

function ProductModal({
  product,
  onClose,
}: {
  product: VisualProduct;
  onClose: () => void;
}) {
  const { addItem } = useCartStore();
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);
  const maxStock = product.stock ?? 99;

  const handleAdd = () => {
    addItem({
      id: Number(product.id),
      name: product.name,
      price: Number(product.price) || 0,
      image: product.image || '',
      maxStock,
      quantity: qty,
    });
    setAdded(true);
    toast.success(`🛒 Added ${qty}× ${product.name} to cart!`);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    // Backdrop — click outside closes
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Glass backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal card — stop propagation so clicking inside doesn't close */}
      <div
        className="relative z-10 bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-20 p-2 rounded-full bg-background/80 hover:bg-secondary text-muted-foreground hover:text-foreground transition cursor-pointer"
          aria-label="Close product modal"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product image */}
        <div className="relative aspect-[4/3] bg-gradient-to-br from-secondary/40 to-secondary/10 overflow-hidden">
          {product.image ? (
            <img
              src={product.image}
              alt={product.name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-16 h-16 text-muted-foreground/20" />
            </div>
          )}
          {product.category && (
            <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm px-2 py-0.5 rounded-full border border-border/50">
              {product.category}
            </span>
          )}
        </div>

        {/* Details */}
        <div className="p-5 space-y-4">
          <div>
            <h3 className="font-bold text-base text-foreground">{product.name}</h3>
            {product.description && (
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3">
                {product.description}
              </p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="text-xl font-bold text-primary">₹{formatPrice(product.price)}</p>
              <StarRating value={product.rating} />
            </div>
            {product.stock !== undefined && (
              <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                product.stock > 10
                  ? 'bg-emerald-500/10 text-emerald-600'
                  : product.stock > 0
                  ? 'bg-orange-500/10 text-orange-500'
                  : 'bg-red-500/10 text-red-500'
              }`}>
                {product.stock > 10 ? 'In Stock' : product.stock > 0 ? `Only ${product.stock} left` : 'Out of Stock'}
              </span>
            )}
          </div>

          {/* Quantity + Add to Cart */}
          <div className="flex gap-3 items-center">
            <div className="flex items-center gap-2 bg-secondary/40 rounded-xl p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition cursor-pointer"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="text-sm font-bold w-5 text-center">{qty}</span>
              <button
                onClick={() => setQty(Math.min(maxStock, qty + 1))}
                className="w-7 h-7 flex items-center justify-center rounded-lg hover:bg-background transition cursor-pointer"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={(product.stock ?? 1) === 0}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition flex items-center justify-center gap-2 cursor-pointer ${
                added
                  ? 'bg-emerald-500 text-white'
                  : 'bg-primary text-white hover:bg-primary/90 disabled:opacity-50'
              }`}
            >
              {added ? <Check className="w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
              {added ? 'Added!' : 'Add to Cart'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Products Renderer ────────────────────────────────────────────────────────

function ProductsRenderer({ products }: { products: VisualProduct[] }) {
  const [selectedProduct, setSelectedProduct] = useState<VisualProduct | null>(null);
  const { addItem } = useCartStore();

  const handleQuickAdd = (e: React.MouseEvent, product: VisualProduct) => {
    e.stopPropagation();
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

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-muted-foreground gap-3">
        <Package className="w-12 h-12 opacity-30" />
        <p className="text-sm">No products found</p>
      </div>
    );
  }

  return (
    <>
      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      <div className="space-y-4 h-full flex flex-col">
        <div className="flex items-center justify-between shrink-0">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {products.length} Product{products.length > 1 ? 's' : ''} Found
          </p>
          <p className="text-[10px] text-muted-foreground">Click a product for details</p>
        </div>

        {/* Horizontal scroll strip */}
        <div className="flex gap-4 overflow-x-auto pb-3 no-scrollbar flex-1 items-start">
          {products.map((p) => (
            <div
              key={p.id}
              onClick={() => setSelectedProduct(p)}
              className="group bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 cursor-pointer shrink-0 w-44 flex flex-col"
            >
              {/* Image */}
              <div className="relative aspect-square bg-gradient-to-br from-secondary/50 to-secondary/20 overflow-hidden">
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <Package className="w-8 h-8 text-muted-foreground/25" />
                  </div>
                )}
                {p.category && (
                  <span className="absolute top-1.5 left-1.5 text-[8px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm px-1.5 py-0.5 rounded-full border border-border/40">
                    {p.category}
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-3 flex flex-col gap-2 flex-1">
                <div>
                  <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-tight">{p.name}</h4>
                  <p className="text-sm font-bold text-primary mt-1">₹{formatPrice(p.price)}</p>
                  <StarRating value={p.rating} />
                </div>

                {p.stock !== undefined && p.stock <= 5 && p.stock > 0 && (
                  <span className="text-[9px] text-orange-500 font-semibold">Only {p.stock} left!</span>
                )}

                <button
                  onClick={(e) => handleQuickAdd(e, p)}
                  className="w-full mt-auto py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <ShoppingCart className="w-3 h-3" />
                  Quick Add
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Chart Renderer ───────────────────────────────────────────────────────────

function ChartRenderer({ chart }: { chart: VisualChart }) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 shrink-0">
        <TrendingUp className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Analytics Chart</p>
      </div>
      <div className="flex-1 flex items-center">
        <div className="w-full">
          <SvgChart
            type={chart.type}
            title={chart.title}
            labels={chart.labels}
            values={chart.values}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Comparison Renderer ──────────────────────────────────────────────────────

function ComparisonRenderer({ data }: { data: { headers: string[]; rows: ComparisonRow[] } }) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 shrink-0">
        <TableIcon className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Comparison</p>
      </div>
      <div className="overflow-auto rounded-xl border border-border/60 flex-1">
        <table className="w-full text-[11px]">
          <thead className="sticky top-0">
            <tr className="bg-primary/10">
              {data.headers.map((h, i) => (
                <th key={i} className="px-4 py-2.5 text-left font-bold text-foreground whitespace-nowrap border-b border-border/60">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.rows.map((row, i) => (
              <tr key={i} className={`${i % 2 === 0 ? 'bg-secondary/10' : 'bg-card'} hover:bg-primary/5 transition-colors`}>
                {data.headers.map((h, j) => (
                  <td key={j} className="px-4 py-2.5 text-muted-foreground border-b border-border/20 whitespace-nowrap">
                    {j === 0 ? <span className="font-semibold text-foreground">{String(row[h] ?? '—')}</span> : String(row[h] ?? '—')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Web Search Renderer ──────────────────────────────────────────────────────

function WebSearchRenderer({ results }: { results: { title: string; url: string; snippet: string }[] }) {
  return (
    <div className="flex flex-col gap-4 h-full">
      <div className="flex items-center gap-2 shrink-0">
        <Search className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Search Results</p>
      </div>
      <div className="flex flex-col gap-3 overflow-y-auto flex-1 no-scrollbar">
        {results.map((r, i) => (
          <a
            key={i}
            href={r.url}
            target="_blank"
            rel="noopener noreferrer"
            className="block p-4 bg-card border border-border/60 rounded-2xl hover:border-primary/40 hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between gap-2">
              <div>
                <p className="text-xs font-bold text-foreground group-hover:text-primary transition">{r.title}</p>
                <p className="text-[10px] text-primary/70 mt-0.5 truncate">{r.url}</p>
              </div>
              <ExternalLink className="w-3.5 h-3.5 text-muted-foreground shrink-0 mt-0.5" />
            </div>
            <p className="text-[11px] text-muted-foreground mt-2 line-clamp-2">{r.snippet}</p>
          </a>
        ))}
      </div>
    </div>
  );
}

// ─── Image Renderer ───────────────────────────────────────────────────────────

function ImageRenderer({ url, prompt }: { url: string; prompt?: string }) {
  return (
    <div className="flex flex-col gap-4 h-full items-center">
      <div className="flex items-center gap-2 w-full shrink-0">
        <ImageIcon className="w-4 h-4 text-primary" />
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Generated Image</p>
      </div>
      <div className="flex-1 flex items-center justify-center w-full">
        <div className="rounded-2xl overflow-hidden border border-border/60 shadow-lg max-h-[60vh]">
          <img src={url} alt={prompt || 'Generated image'} className="object-contain max-h-[55vh] w-full" />
        </div>
      </div>
      {prompt && <p className="text-[10px] text-muted-foreground text-center italic">"{prompt}"</p>}
    </div>
  );
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-4 text-center px-8">
      <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
        <TrendingUp className="w-8 h-8 text-primary/40" />
      </div>
      <div>
        <p className="text-sm font-semibold text-foreground">Visual results will appear here</p>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
          Ask JARVIS to show products, charts, comparisons, or search results and they'll be displayed in this panel.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 w-full max-w-xs mt-2">
        {[
          { icon: '💄', label: 'Show products' },
          { icon: '📊', label: 'Sales chart' },
          { icon: '🔍', label: 'Compare items' },
          { icon: '📦', label: 'My orders' },
        ].map((hint) => (
          <div key={hint.label} className="flex items-center gap-2 p-2.5 bg-secondary/30 rounded-xl border border-border/30">
            <span className="text-base">{hint.icon}</span>
            <span className="text-[10px] text-muted-foreground font-medium">{hint.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main Export ──────────────────────────────────────────────────────────────

export function VisualContentRenderer({ content }: { content: VisualContent | null }) {
  if (!content || content.visualType === 'empty') return <EmptyState />;

  switch (content.visualType) {
    case 'products':
      return <ProductsRenderer products={content.products || []} />;
    case 'chart':
      return content.chart ? <ChartRenderer chart={content.chart} /> : <EmptyState />;
    case 'comparison':
      return content.comparison ? <ComparisonRenderer data={content.comparison} /> : <EmptyState />;
    case 'web_search':
      return content.webSearch ? <WebSearchRenderer results={content.webSearch} /> : <EmptyState />;
    case 'image':
      return content.imageUrl ? <ImageRenderer url={content.imageUrl} prompt={content.imagePrompt} /> : <EmptyState />;
    default:
      return <EmptyState />;
  }
}
