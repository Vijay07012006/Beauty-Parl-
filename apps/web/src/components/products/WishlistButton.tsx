'use client';

import { useWishlistStore, WishlistItem } from '@/store/wishlistStore';
import { cn } from '@/lib/utils';

interface WishlistButtonProps {
  item: WishlistItem;
  className?: string;
}

export function WishlistButton({ item, className }: WishlistButtonProps) {
  const { toggleItem, isInWishlist } = useWishlistStore();
  const active = isInWishlist(item.id);

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleItem(item);
  };

  return (
    <button
      onClick={handleToggle}
      className={cn(
        "p-2 rounded-full border border-border bg-card/80 hover:bg-card hover:scale-105 hover:shadow-md transition-all active:scale-95 cursor-pointer text-muted-foreground",
        active && "text-red-500 border-red-100 bg-red-50/50 hover:bg-red-50",
        className
      )}
      aria-label={active ? "Remove from Wishlist" : "Add to Wishlist"}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill={active ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-[18px] h-[18px]"
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
}
