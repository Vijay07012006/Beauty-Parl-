import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: number;
  name: string;
  price: number;
  image: string;
  quantity: number;
  maxStock: number;
}

interface CartStore {
  items: CartItem[];
  addItem: (item: Omit<CartItem, 'quantity'> & { quantity?: number }) => void;
  removeItem: (id: number) => void;
  updateQuantity: (id: number, quantity: number) => void;
  clearCart: () => void;
  totalItems: () => number;
  subtotal: () => number;
  total: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        // ✅ Always ensure price is a number — prevents toFixed crash
        const safePrice = Number(item.price) || 0;
        const safeMaxStock = Number(item.maxStock) || 99;
        const { items } = get();
        const existing = items.find(i => i.id === item.id);
        if (existing) {
          const newQty = Math.min(existing.quantity + (item.quantity || 1), existing.maxStock);
          set({ items: items.map(i => i.id === item.id ? { ...i, quantity: newQty } : i) });
        } else {
          set({ items: [...items, { ...item, price: safePrice, maxStock: safeMaxStock, quantity: item.quantity || 1 }] });
        }
      },

      removeItem: (id) => {
        set({ items: get().items.filter(i => i.id !== id) });
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }
        const item = get().items.find(i => i.id === id);
        if (!item) return;
        const maxQty = Math.min(quantity, item.maxStock);
        set({ items: get().items.map(i => i.id === id ? { ...i, quantity: maxQty } : i) });
      },

      clearCart: () => set({ items: [] }),

      totalItems: () => {
        return get().items.reduce((sum, i) => sum + i.quantity, 0);
      },

      subtotal: () => {
        // ✅ Safe: coerce each item price to number
        return get().items.reduce((sum, i) => sum + (Number(i.price) || 0) * i.quantity, 0);
      },

      total: () => {
        const subtotal = get().subtotal();
        const shipping = subtotal > 50 ? 0 : 5;
        const tax = subtotal * 0.1;
        return subtotal + tax + shipping;
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);
