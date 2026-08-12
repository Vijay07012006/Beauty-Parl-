import { create } from 'zustand';
import { api } from '@/lib/api';

interface User {
  id: number;
  email: string;
  name: string;
  role: 'user' | 'admin' | 'super_admin';
  phone?: string;
  isVerified?: boolean;
  loyaltyPoints?: number;
  loyaltyTier?: string;
  totalSpent?: number;
  birthday?: string;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<{ success: boolean; requiresOtp?: boolean; user?: User; error?: string }>;
  register: (name: string, email: string, password: string, phone: string, referralCode?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  verifyOtp: (email: string, otp: string) => Promise<{ success: boolean; error?: string }>;
  resendOtp: (email: string) => Promise<{ success: boolean; error?: string }>;
  forgotPassword: (email: string) => Promise<{ success: boolean; error?: string }>;
  resetPassword: (token: string, newPassword: string) => Promise<{ success: boolean; error?: string }>;
  updateProfile: (name: string, phone: string, birthday?: string) => Promise<{ success: boolean; user?: User; error?: string }>;
  logout: () => void;
  hydrate: () => void;
  clearError: () => void;
}

export const useAuthStore = create<AuthStore>((set, get) => {
  // M-8: hydrate synchronously at store creation (module scope) so the api Authorization
  // header is present before any component effect fires — eliminates the admin hydration race.
  let initialToken: string | null = null;
  let initialUser: User | null = null;
  if (typeof window !== 'undefined') {
    try {
      const rawToken = localStorage.getItem('token');
      const rawUser = localStorage.getItem('user');
      if (rawToken && rawUser) {
        initialToken = rawToken;
        initialUser = JSON.parse(rawUser);
        api.defaults.headers.common['Authorization'] = `Bearer ${rawToken}`;
      }
    } catch {
      // ignore malformed persisted state
    }
  }

  return {
  user: initialUser,
  token: initialToken,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
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

      if (data.requiresOtp) {
        set({ loading: false });
        return { success: true, requiresOtp: true, user: data.user };
      }

      const { access_token, user } = data;
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
      set({ user, token: access_token, loading: false });
      return { success: true, user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Login failed';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  register: async (name: string, email: string, password: string, phone: string, referralCode?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/register', { name, email, password, phone, referralCode });
      const data = response.data;
      set({ loading: false });
      return { success: true, user: data.user };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Registration failed';
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
      const message = error.response?.data?.message || 'Invalid OTP';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  resendOtp: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/resend-otp', { email });
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to resend OTP';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  forgotPassword: async (email: string) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/forgot-password', { email });
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to send reset link';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  resetPassword: async (token: string, newPassword: string) => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/reset-password', { token, newPassword });
      set({ loading: false });
      return { success: true };
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to reset password';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  updateProfile: async (name: string, phone: string, birthday?: string) => {
    set({ loading: true, error: null });
    try {
      const response = await api.put('/auth/profile', { name, phone, birthday });
      const data = response.data;
      if (data.success && data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        set({ user: data.user, loading: false });
        return { success: true, user: data.user };
      }
      throw new Error('Profile update failed');
    } catch (error: any) {
      const message = error.response?.data?.message || 'Failed to update profile';
      set({ error: message, loading: false });
      return { success: false, error: message };
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    localStorage.removeItem('wishlist-storage'); // clear wishlisted items on logout
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
  };
});
