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

interface LoginResult {
  requiresOtp?: boolean;
  email?: string;
  success?: boolean;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<LoginResult>;
  register: (name: string, email: string, password: string, phone?: string) => Promise<void>;
  sendOtp: (email: string, phone?: string) => Promise<boolean>;
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
          set({ token, user: JSON.parse(user) });
        } catch {
          localStorage.removeItem('token');
          localStorage.removeItem('user');
        }
      }
    }
  },

  login: async (email: string, password: string): Promise<LoginResult> => {
    set({ loading: true, error: null });
    try {
      const response = await api.post('/auth/login', { email, password });
      const data = response.data;

      // Unverified user — OTP required
      if (data.requiresOtp) {
        set({ loading: false });
        return { requiresOtp: true, email: data.email || email };
      }

      const { access_token, user } = data;
      if (typeof window !== 'undefined') {
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
      }
      set({ user, token: access_token, loading: false, error: null });
      return { success: true };
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message[0]
          : null) ||
        'Invalid email or password';
      set({ error: msg, loading: false });
      return { success: false };
    }
  },

  register: async (name: string, email: string, password: string, phone?: string): Promise<void> => {
    set({ loading: true, error: null });
    try {
      await api.post('/auth/register', { name, email, password, phone });
      set({ loading: false });
    } catch (error: any) {
      const msg =
        error.response?.data?.message ||
        (Array.isArray(error.response?.data?.message)
          ? error.response.data.message[0]
          : null) ||
        'Registration failed. Please try again.';
      set({ error: msg, loading: false });
      throw new Error(msg);
    }
  },

  sendOtp: async (email: string, phone?: string): Promise<boolean> => {
    try {
      await api.post('/auth/send-otp', { email, phone });
      return true;
    } catch (error: any) {
      console.error('[sendOtp] Failed:', error.response?.data?.message || error.message);
      return false;
    }
  },

  logout: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    set({ user: null, token: null, error: null });
  },
}));
