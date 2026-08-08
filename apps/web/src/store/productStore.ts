import { create } from 'zustand';
import { api } from '@/lib/api';

export interface Product {
  id: number;
  name: string;
  brand?: string;
  description: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  image: string;
  category: string;
  stock: number;
  rating?: number;
  ratingCount?: number;
}

// ✅ Normalize a raw product object — ensures price/mrp/stock/rating are always numbers
function normalizeProduct(raw: any): Product {
  return {
    ...raw,
    price: Number(raw.price) || 0,
    mrp: raw.mrp !== undefined && raw.mrp !== null ? Number(raw.mrp) : undefined,
    discountPercent: raw.discountPercent !== undefined ? Number(raw.discountPercent) : undefined,
    stock: Number(raw.stock) || 0,
    rating: raw.rating !== undefined ? Number(raw.rating) : undefined,
    ratingCount: raw.ratingCount !== undefined ? Number(raw.ratingCount) : undefined,
  };
}

interface ProductStore {
  products: Product[];
  loading: boolean;
  error: string | null;
  fetchProducts: () => Promise<void>;
  getProduct: (id: number) => Promise<Product>;
}

export const useProductStore = create<ProductStore>((set, get) => ({
  products: [],
  loading: false,
  error: null,

  fetchProducts: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/products');
      const data = response.data;
      // ✅ Handle both array and paginated { products: [...] } responses
      const raw = Array.isArray(data) ? data : (data.products || data.data || []);
      const normalized = Array.isArray(raw) ? raw.map(normalizeProduct) : [];
      set({ products: normalized, loading: false });
    } catch (error: any) {
      console.error('❌ Fetch products error:', error);
      set({
        error: error?.response?.data?.message || 'Failed to fetch products',
        loading: false,
        products: [],
      });
    }
  },

  getProduct: async (id: number) => {
    try {
      const response = await api.get(`/products/${id}`);
      return normalizeProduct(response.data);
    } catch (error) {
      throw new Error('Product not found');
    }
  },
}));
