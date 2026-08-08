import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface WishlistItem {
  id: number;
  name: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  image: string;
  rating?: number;
  ratingCount?: number;
  stock: number;
}

interface WishlistStore {
  items: WishlistItem[];
  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  isInWishlist: (id: number) => boolean;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      toggleItem: (item) => {
        const { items } = get();
        const exists = items.some(i => i.id === item.id);
        if (exists) {
          set({ items: items.filter(i => i.id !== item.id) });
        } else {
          set({ items: [...items, item] });
        }
      },
      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },
      isInWishlist: (id) => {
        return get().items.some(i => i.id === id);
      }
    }),
    {
      name: 'wishlist-storage',
    }
  )
);
