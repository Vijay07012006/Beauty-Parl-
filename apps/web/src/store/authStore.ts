import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  isVerified?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresOtp?: boolean; user?: User }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; user?: User }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean }>;
  logout: () => void;
  hydrate: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    if (token && user) {
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      set({ token, user: JSON.parse(user) });
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;
      
      // If unverified, return requiresOtp flag
      if (data.requiresOtp) {
        set({ loading: false });
        return { success: true, requiresOtp: true, user: data.user };
      }
      
      // Verified user
      const { access_token, user } = data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      set({ user, token: access_token, loading: false });
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  register: async (name: string, email: string, password: string, phone: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, phone });
      const user = response.data.user || response.data;
      set({ loading: false });
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/verify-otp', { email, otp });
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
}));
