'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OtpModal } from '@/components/auth/OtpModal';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, loading, error, clearError } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState('');
  const [unverifiedPassword, setUnverifiedPassword] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    clearError();
    const msg = searchParams.get('message');
    if (msg) setMessage(msg);
    const verified = searchParams.get('verified');
    if (verified === 'true') setMessage('✅ Account verified! Please login.');
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await login(email, password);
    if (result.success && result.requiresOtp) {
      setUnverifiedEmail(email);
      setUnverifiedPassword(password);
      setShowOtpModal(true);
    } else if (result.success && result.user) {
      const user = result.user;
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/en/admin/dashboard');
      } else {
        router.push('/en');
      }
    }
  };

  const handleOtpVerified = async () => {
    setShowOtpModal(false);
    const result = await login(unverifiedEmail, unverifiedPassword);
    if (result.success && result.user) {
      const user = result.user;
      if (user.role === 'admin' || user.role === 'super_admin') {
        router.push('/en/admin/dashboard');
      } else {
        router.push('/en');
      }
    }
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
  };

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h1 className="text-3xl font-playfair font-bold text-center mb-6">Welcome Back</h1>
            <p className="text-muted-foreground text-center mb-8">Sign in to your account</p>

            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {message}
              </div>
            )}
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
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium disabled:opacity-50"
              >
                {loading ? 'Loading...' : 'Sign In'}
              </button>
            </form>

            <div className="mt-4 text-center">
              <Link href="/en/auth/forgot-password" className="text-sm text-primary hover:underline">
                Forgot Password?
              </Link>
            </div>

            <SocialLoginButtons redirectPath="/" />

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
          email={unverifiedEmail}
          onVerified={handleOtpVerified}
          onClose={handleOtpClose}
        />
      )}
      <Footer />
    </>
  );
}
