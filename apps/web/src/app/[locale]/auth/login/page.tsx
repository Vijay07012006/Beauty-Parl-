'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Eye, EyeOff } from 'lucide-react';
import { OtpModal } from '@/components/auth/OtpModal';

export default function LoginPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';
  const { login, loading, error, user, hydrate, sendOtp } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState('');

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    // If user already logged in, redirect based on role
    if (user) {
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/en/admin/dashboard');
      } else {
        router.push('/en');
      }
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const res = await login(email, password);

    if (res.requiresOtp) {
      const resolvedEmail = res.email || email;
      setOtpEmail(resolvedEmail);
      // Auto-send OTP so user sees it immediately in terminal
      await sendOtp(resolvedEmail);
      setShowOtpModal(true);
      return;
    }

    if (res.success) {
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role === 'admin' || currentUser?.role === 'super_admin') {
        router.push('/en/admin/dashboard');
      } else {
        router.push('/en');
      }
    }
    // Error is already set in store state via `error`, displayed in the form
  };

  const handleOtpVerified = async () => {
    setShowOtpModal(false);
    // Auto-login
    await login(email, password);
    const currentUser = useAuthStore.getState().user;
    if (currentUser) {
      if (currentUser.role === 'admin' || currentUser.role === 'super_admin') {
        router.push('/en/admin/dashboard');
      } else {
        router.push('/en');
      }
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h1 className="text-3xl font-playfair font-bold text-center mb-2">Welcome Back</h1>
            <p className="text-muted-foreground text-center mb-6">Sign in to your account</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="w-full p-3 rounded-xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 pr-12"
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors cursor-pointer"
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div className="text-right">
                <Link href={`/${locale}/auth/forgot-password`} className="text-sm text-primary hover:underline">
                  Forgot Password?
                </Link>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Don't have an account?{' '}
              <Link href="/en/auth/register" className="text-primary hover:underline">
                Sign Up
              </Link>
            </p>
          </div>
        </div>
      </main>

      {showOtpModal && (
        <OtpModal 
          email={otpEmail} 
          onVerified={handleOtpVerified} 
          onClose={() => setShowOtpModal(false)}
        />
      )}

      <Footer />
    </>
  );
}
