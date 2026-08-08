'use client';

import { useEffect, useRef } from 'react';

interface InfiniteScrollProps {
  hasMore: boolean;
  loading: boolean;
  onLoadMore: () => void;
}

export function InfiniteScroll({ hasMore, loading, onLoadMore }: InfiniteScrollProps) {
  const triggerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hasMore || loading) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          onLoadMore();
        }
      },
      { rootMargin: '300px' }
    );

    if (triggerRef.current) {
      observer.observe(triggerRef.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loading, onLoadMore]);

  return (
    <div ref={triggerRef} className="w-full flex justify-center py-8">
      {loading && (
        <div className="flex flex-col items-center gap-2">
          <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-xs text-muted-foreground animate-pulse">Loading more products...</span>
        </div>
      )}
    </div>
  );
}
