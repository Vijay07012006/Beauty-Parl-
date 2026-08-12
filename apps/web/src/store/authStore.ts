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
  setSession: (access_token: string, user: User) => void;
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
  // M-8 / residual fix: the JWT now lives ONLY in an HttpOnly cookie (bp_token) set by
  // the server — it is never persisted to localStorage. On boot we restore the cached
  // (non-sensitive) user for instant UI, then verify the cookie session via /auth/profile.
  let initialUser: User | null = null;
  if (typeof window !== 'undefined') {
    try {
      const rawUser = localStorage.getItem('user');
      if (rawUser) {
        initialUser = JSON.parse(rawUser);
      }
    } catch {
      // ignore malformed persisted state
    }
  }

  return {
  user: initialUser,
  token: null,
  loading: false,
  error: null,

  clearError: () => set({ error: null }),

  hydrate: () => {
    if (typeof window === 'undefined') return;
    const rawUser = localStorage.getItem('user');
    if (rawUser) {
      try {
        set({ user: JSON.parse(rawUser) });
      } catch {}
    }
    // Validate the HttpOnly cookie session in the background. No token is stored
    // client-side, so /auth/profile (sent with credentials) is the source of truth.
    api.get('/auth/profile')
      .then((res) => {
        const freshUser = res.data;
        localStorage.setItem('user', JSON.stringify(freshUser));
        set({ user: freshUser });
      })
      .catch(() => {
        localStorage.removeItem('user');
        set({ user: null, token: null });
      });
  },

  setSession: (access_token: string, user: User) => {
    api.defaults.headers.common['Authorization'] = `Bearer ${access_token}`;
    localStorage.setItem('user', JSON.stringify(user));
    set({ user, token: access_token, loading: false, error: null });
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
      get().setSession(access_token, user);
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

  logout: async () => {
    // Tell the server to clear the HttpOnly cookie + revoke the session. The client
    // cannot delete an HttpOnly cookie itself, so this round-trip is mandatory.
    try {
      await api.post('/auth/logout');
    } catch {
      // still clear local state even if the network call fails
    }
    localStorage.removeItem('user');
    localStorage.removeItem('wishlist-storage'); // clear wishlisted items on logout
    delete api.defaults.headers.common['Authorization'];
    set({ user: null, token: null });
  },
  };
});
