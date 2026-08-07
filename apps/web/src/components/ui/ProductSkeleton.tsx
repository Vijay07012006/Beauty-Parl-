'use client';

export function ProductSkeleton() {
  return (
    <div className="animate-pulse bg-card rounded-2xl p-4 border border-border/30">
      <div className="h-48 bg-secondary/50 rounded-xl mb-4" />
      <div className="h-4 bg-secondary/50 rounded w-3/4 mb-2" />
      <div className="h-4 bg-secondary/50 rounded w-1/2" />
    </div>
  );
}
