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
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  token: null,
  loading: false,
  error: null,

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
      const { access_token, user, requiresOtp } = response.data;
      
      // If user is not verified, return requiresOtp flag without setting session
      if (requiresOtp) {
        set({ loading: false });
        return { success: true, requiresOtp: true, user };
      }
      
      // Verified user: set session
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      set({ user, token: access_token, loading: false });
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed. Please check your credentials.';
      set({ error: message, loading: false });
      return { success: false };
    }
  },

  register: async (name: string, email: string, password: string, phone: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, phone });
      const user = response.data.user || response.data;
      
      // ✅ Registration successful — return user data, DO NOT auto-login
      set({ loading: false });
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed. Please try again.';
      set({ error: message, loading: false });
      return { success: false };
    }
  },

  verifyOtp: async (email: string, otp: string) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/verify-otp', { email, otp });
      
      // After OTP verification, we need to log in the user
      // We don't have password here, so we'll redirect to login page
      // OR we can store password temporarily — let's just redirect to login
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Invalid OTP. Please try again.';
      set({ error: message, loading: false });
      return { success: false };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
}));
