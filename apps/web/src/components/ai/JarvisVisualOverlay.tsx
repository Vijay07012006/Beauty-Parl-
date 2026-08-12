'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { SvgChart } from './SvgChart';
import {
  X, ShoppingBag, Star, ShoppingCart, TrendingUp, BarChart2,
  Table, ArrowRight, ChevronRight, Sparkles, Package
} from 'lucide-react';
import { toast } from 'sonner';

interface Product {
  id: number | string;
  name: string;
  price: number | string;
  image?: string;
  rating?: number;
  category?: string;
  description?: string;
  stock?: number;
}

interface ChartData {
  type: 'bar' | 'line' | 'pie';
  title: string;
  labels: string[];
  values: number[];
}

interface ComparisonItem {
  feature: string;
  [key: string]: string | number;
}

export interface VisualOverlayData {
  visual_type?: 'products' | 'chart' | 'comparison' | 'navigation';
  products?: Product[];
  chart?: ChartData;
  comparison?: {
    headers: string[];
    rows: ComparisonItem[];
  };
  navigation?: string;
}

interface Props {
  data: VisualOverlayData | null;
  onClose: () => void;
}

function StarRating({ rating }: { rating?: number }) {
  const stars = Math.round(rating || 0);
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`w-2.5 h-2.5 ${i <= stars ? 'text-amber-400 fill-amber-400' : 'text-muted-foreground/30'}`}
        />
      ))}
    </div>
  );
}

function ProductCard({ product, onAddToCart }: { product: Product; onAddToCart: (p: Product) => void }) {
  return (
    <div className="group bg-card border border-border/60 rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 flex flex-col">
      {/* Product Image */}
      <div className="relative aspect-square bg-gradient-to-br from-secondary/50 to-secondary/20 overflow-hidden">
        {product.image ? (
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl">
            <Package className="w-8 h-8 text-muted-foreground/30" />
          </div>
        )}
        {product.category && (
          <span className="absolute top-2 left-2 text-[9px] font-bold uppercase tracking-wider bg-background/80 backdrop-blur-sm text-foreground px-2 py-0.5 rounded-full border border-border/50">
            {product.category}
          </span>
        )}
      </div>

      {/* Product Details */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <h4 className="font-semibold text-xs text-foreground line-clamp-2 leading-tight">{product.name}</h4>
          {product.description && (
            <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2">{product.description}</p>
          )}
        </div>

        <div className="flex items-center justify-between mt-auto">
          <div>
            <p className="text-sm font-bold text-primary">₹{Number(product.price).toFixed(2)}</p>
            <StarRating rating={product.rating} />
          </div>
          {product.stock !== undefined && product.stock <= 5 && (
            <span className="text-[9px] text-orange-500 font-bold">Low Stock</span>
          )}
        </div>

        <button
          onClick={() => onAddToCart(product)}
          className="w-full py-1.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-xl text-[10px] font-bold transition-all duration-200 flex items-center justify-center gap-1.5 cursor-pointer mt-1"
        >
          <ShoppingCart className="w-3 h-3" />
          Add to Cart
        </button>
      </div>
    </div>
  );
}

function ComparisonTable({ data }: { data: { headers: string[]; rows: ComparisonItem[] } }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-border/60">
      <table className="w-full text-[11px]">
        <thead>
          <tr className="bg-primary/10">
            {data.headers.map((h, i) => (
              <th key={i} className="px-3 py-2 text-left font-bold text-foreground whitespace-nowrap border-b border-border/60">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.rows.map((row, i) => (
            <tr key={i} className={`${i % 2 === 0 ? 'bg-secondary/15' : 'bg-card'} hover:bg-primary/5 transition-colors`}>
              {data.headers.map((h, j) => (
                <td key={j} className="px-3 py-2 text-muted-foreground border-b border-border/30 whitespace-nowrap">
                  {j === 0 ? (
                    <span className="font-semibold text-foreground">{row[h]}</span>
                  ) : (
                    String(row[h] ?? '—')
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function JarvisVisualOverlay({ data, onClose }: Props) {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { addItem } = useCartStore();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (data) {
      // Delay to trigger entry animation
      const t = setTimeout(() => setIsVisible(true), 50);
      return () => clearTimeout(t);
    } else {
      setIsVisible(false);
    }
  }, [data]);

  if (!data) return null;

  const handleAddToCart = (product: Product) => {
    addItem({
      id: Number(product.id),
      name: product.name,
      price: Number(product.price),
      image: product.image || '',
      maxStock: product.stock || 10,
      quantity: 1,
    });
    toast.success(`🛒 Added ${product.name} to cart!`);
  };

  const handleNavigate = (route: string) => {
    // Client-side enforcement: only allow relative paths, no external URLs
    if (!route.startsWith('/') || route.startsWith('//') || /^\/\/|https?:\/\//.test(route)) {
      toast.error('Invalid navigation destination');
      return;
    }
    toast.info(`Navigating to ${route}...`);
    setTimeout(() => {
      router.push(`/${locale}${route}`);
      onClose();
    }, 600);
  };

  const hasProducts = data.products && data.products.length > 0;
  const hasChart = !!data.chart;
  const hasComparison = !!data.comparison;
  const hasNavigation = !!data.navigation;

  const title = hasProducts
    ? `${data.products!.length} Product${data.products!.length > 1 ? 's' : ''} Found`
    : hasChart
    ? data.chart!.title
    : hasComparison
    ? 'Comparison'
    : hasNavigation
    ? 'Navigation'
    : 'Visual Results';

  const Icon = hasProducts ? ShoppingBag : hasChart ? BarChart2 : hasComparison ? Table : ArrowRight;

  return (
    <div
      className={`fixed inset-y-0 right-0 z-40 flex flex-col pointer-events-none`}
      style={{ paddingBottom: '6rem', paddingTop: '1rem' }}
    >
      <div
        className={`
          pointer-events-auto
          w-[340px] max-w-[90vw] h-full
          bg-card/95 backdrop-blur-xl
          border border-border/50 rounded-l-3xl
          shadow-2xl flex flex-col overflow-hidden
          transition-all duration-400 ease-out
          ${isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'}
        `}
        style={{ transitionProperty: 'transform, opacity' }}
      >
        {/* Panel Header */}
        <div className="px-4 py-3.5 bg-gradient-to-r from-primary/10 via-purple-500/10 to-transparent border-b border-border/50 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-xl bg-primary/20 flex items-center justify-center">
              <Icon className="w-3.5 h-3.5 text-primary" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-foreground flex items-center gap-1">
                {title} <Sparkles className="w-3 h-3 text-primary" />
              </h3>
              <p className="text-[10px] text-muted-foreground">JARVIS Visual Results</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-secondary/50 text-muted-foreground hover:text-foreground transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">

          {/* Products Grid */}
          {hasProducts && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <ShoppingBag className="w-3 h-3" />
                <span>Recommended Products</span>
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {data.products!.map((p) => (
                  <ProductCard key={p.id} product={p} onAddToCart={handleAddToCart} />
                ))}
              </div>
            </div>
          )}

          {/* Chart */}
          {hasChart && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <TrendingUp className="w-3 h-3" />
                <span>Analytics Chart</span>
              </div>
              <SvgChart
                type={data.chart!.type}
                title={data.chart!.title}
                labels={data.chart!.labels}
                values={data.chart!.values}
              />
            </div>
          )}

          {/* Comparison Table */}
          {hasComparison && (
            <div className="space-y-3">
              <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                <Table className="w-3 h-3" />
                <span>Comparison</span>
              </div>
              <ComparisonTable data={data.comparison!} />
            </div>
          )}

          {/* Navigation Prompt */}
          {hasNavigation && (
            <div className="rounded-2xl border border-primary/30 bg-primary/5 p-4 space-y-3">
              <div className="flex items-center gap-2">
                <ArrowRight className="w-4 h-4 text-primary" />
                <p className="text-xs font-semibold text-foreground">Ready to Navigate</p>
              </div>
              <p className="text-[11px] text-muted-foreground">
                JARVIS wants to take you to:{' '}
                <span className="font-bold text-primary font-mono">{data.navigation}</span>
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => handleNavigate(data.navigation!)}
                  className="flex-1 py-2 bg-primary text-white rounded-xl text-[11px] font-bold hover:bg-primary/90 transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  Go Now <ChevronRight className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={onClose}
                  className="px-3 py-2 bg-secondary/50 text-muted-foreground rounded-xl text-[11px] font-bold hover:bg-secondary transition cursor-pointer"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
