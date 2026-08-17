'use client';

import { Sparkles, Flame, CheckCircle } from 'lucide-react';

interface ProductBadgeProps {
  createdAt?: string | Date;
  salesCount?: number;
  viewCount?: number;
}

export function ProductBadge({ createdAt, salesCount = 0, viewCount = 0 }: ProductBadgeProps) {
  // 1. New Arrival: Created within the last 7 days
  const isNewArrival = () => {
    if (!createdAt) return false;
    const created = new Date(createdAt).getTime();
    const now = new Date().getTime();
    const diffDays = (now - created) / (1000 * 60 * 60 * 24);
    return diffDays <= 7;
  };

  // 2. Best Seller: High sales count
  const isBestSeller = () => {
    return salesCount >= 50;
  };

  // 3. Trending: High views count
  const isTrending = () => {
    return viewCount >= 100;
  };

  if (isBestSeller()) {
    return (
      <span className="inline-flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
        <CheckCircle className="w-3 h-3 fill-amber-500/25" /> Best Seller
      </span>
    );
  }

  if (isNewArrival()) {
    return (
      <span className="inline-flex items-center gap-1 bg-primary/10 border border-primary/20 text-primary font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md">
        <Sparkles className="w-3 h-3" /> New Arrival
      </span>
    );
  }

  if (isTrending()) {
    return (
      <span className="inline-flex items-center gap-1 bg-indigo-500/10 border border-indigo-500/20 text-indigo-700 dark:text-indigo-400 font-bold text-[9px] uppercase tracking-wider px-2 py-0.5 rounded-md animate-pulse">
        <Flame className="w-3 h-3 fill-indigo-500/25" /> Trending
      </span>
    );
  }

  return null;
}
