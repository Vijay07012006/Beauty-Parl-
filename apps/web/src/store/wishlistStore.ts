import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api } from '@/lib/api';

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
  // Local items (always kept for guest users)
  items: WishlistItem[];
  // Whether we've synced from the server for the current session
  synced: boolean;

  toggleItem: (item: WishlistItem) => void;
  removeItem: (id: number) => void;
  isInWishlist: (id: number) => boolean;
  // API-backed actions — call these when user is logged in
  addToApi: (productId: number) => Promise<void>;
  removeFromApi: (productId: number) => Promise<void>;
  loadFromApi: () => Promise<void>;
  clearSync: () => void;
}

export const useWishlistStore = create<WishlistStore>()(
  persist(
    (set, get) => ({
      items: [],
      synced: false,

      // ---- Guest / local-only ----
      toggleItem: (item) => {
        const { items } = get();
        const exists = items.some(i => i.id === item.id);
        set({ items: exists ? items.filter(i => i.id !== item.id) : [...items, item] });
      },

      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },

      isInWishlist: (id) => get().items.some(i => i.id === id),

      // ---- API-backed (logged-in users) ----
      addToApi: async (productId) => {
        try {
          await api.post(`/wishlist/${productId}`);
          // Reload to get full product data
          await get().loadFromApi();
        } catch (err: any) {
          // 400 = already in wishlist — ignore silently
          if (err?.response?.status !== 400) throw err;
        }
      },

      removeFromApi: async (productId) => {
        try {
          await api.delete(`/wishlist/${productId}`);
          set({ items: get().items.filter(i => i.id !== productId) });
        } catch (err: any) {
          if (err?.response?.status !== 404) throw err;
        }
      },

      loadFromApi: async () => {
        try {
          const res = await api.get('/wishlist');
          const products: any[] = Array.isArray(res.data) ? res.data : [];
          const items: WishlistItem[] = products.map(p => ({
            id: p.id,
            name: p.name,
            price: Number(p.price) || 0,
            mrp: p.mrp ? Number(p.mrp) : undefined,
            discountPercent: p.discountPercent ? Number(p.discountPercent) : undefined,
            image: p.image || '',
            rating: p.rating ? Number(p.rating) : undefined,
            ratingCount: p.ratingCount ? Number(p.ratingCount) : undefined,
            stock: Number(p.stock) || 0,
          }));
          set({ items, synced: true });
        } catch {
          // Silently fail — local items remain
        }
      },

      clearSync: () => set({ synced: false }),
    }),
    { name: 'wishlist-storage' }
  )
);
