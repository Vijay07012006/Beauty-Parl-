'use client';

import { useEffect, useState } from 'react';
import { useWishlistStore, WishlistItem } from '@/store/wishlistStore';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
}

export function WishlistButton({ item, className }: WishlistButtonProps) {
  const { user } = useAuthStore();
  const { toggleItem, isInWishlist, addToApi, removeFromApi, loadFromApi, synced } = useWishlistStore();
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync from API once on first mount when user is logged in
  useEffect(() => {
    setMounted(true);
    if (user && !synced) {
      loadFromApi();
    }
  }, [user, synced, loadFromApi]);

  const active = mounted && isInWishlist(item.id);

  const handleToggle = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      // Guest: local toggle only
      toggleItem(item);
      toast.success(isInWishlist(item.id) ? '💔 Removed from wishlist' : '❤️ Saved to wishlist');
      return;
    }

    // Logged in: API-backed
    setLoading(true);
    try {
      if (active) {
        await removeFromApi(item.id);
        toast.success('💔 Removed from wishlist');
      } else {
        await addToApi(item.id);
        toast.success('❤️ Added to wishlist!');
      }
    } catch {
      toast.error('Failed to update wishlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleToggle}
      disabled={loading}
      className={cn(
        'p-2 rounded-full border border-border bg-card/80 hover:bg-card hover:scale-105 hover:shadow-md transition-all active:scale-95 cursor-pointer text-muted-foreground disabled:opacity-60',
        active && 'text-red-500 border-red-100 bg-red-50/50 hover:bg-red-50',
        className
      )}
      aria-label={active ? 'Remove from Wishlist' : 'Add to Wishlist'}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? 'currentColor' : 'none'}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cn('w-[18px] h-[18px] transition-transform', loading && 'animate-pulse')}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
