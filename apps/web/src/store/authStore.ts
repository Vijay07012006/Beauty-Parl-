import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: string;
  phone?: string;
  isVerified?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresOtp?: boolean; email?: string }>;
  register: (name: string, email: string, password: string, phone: string) => Promise<{ success: boolean; user?: User }>;
  sendOtp: (email: string, phone?: string) => Promise<boolean>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean }>;
  logout: () => void;
  hydrate: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

  hydrate: () => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      const user = localStorage.getItem('user');
      if (token && user) {
        try {
          api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
          set({ token, user: JSON.parse(user) });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  },

  login: async (email: string, password: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      // Unverified user — OTP required
      if (data.requiresOtp) {
        set({ loading: false });
        return { success: true, requiresOtp: true, email: data.email || email };
      }

      // Verified user — set session
      const { access_token, user } = data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      set({ user, token: access_token, loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid email or password';
      set({ error: message, loading: false });
      return { success: false };
    }
  },

  register: async (name: string, email: string, password: string, phone: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, phone });
      const user = response.data.user || response.data;

      // ✅ Registration successful — DO NOT auto-login
      // Backend already sent OTP during registration
      set({ loading: false });
      return { success: true, user };
    } catch (error: any) {
      console.error('❌ Registration error:', error);
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, loading: false });
      return { success: false };
    }
  },

  sendOtp: async (email: string, phone?: string) => {
    try {
      await api.post('/auth/send-otp', { email, phone });
      return true;
    } catch (error: any) {
      console.error('[sendOtp] Failed:', error.response?.data?.message || error.message);
      return false;
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      set({ loading: false });
      return { success: res.data.success };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      set({ error: message, loading: false });
      return { success: false };
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null, error: null });
  },
}));
