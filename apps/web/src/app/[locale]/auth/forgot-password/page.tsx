'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { useLocale } from '@/hooks/useLocale';

export default function ForgotPasswordPage() {
  const locale = useLocale();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');

    try {
      const response = await api.post('/auth/forgot-password', { email });

      // ✅ Always show success message (security)
      if (response.data.success) {
        setMessage('✅ If this email exists, a reset link has been sent. Check your email (or console logs).');
        setEmail('');
      } else {
        setError('❌ ' + (response.data.message || 'Something went wrong. Please try again.'));
      }
    } catch (err: any) {
      console.error('Forgot password error:', err);
      // ✅ Show generic success even on error (security)
      setMessage('✅ If this email exists, a reset link has been sent. Check your email (or console logs).');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h1 className="text-3xl font-playfair font-bold text-center mb-6">Forgot Password</h1>
            <p className="text-muted-foreground text-center mb-8">
              Enter your email to reset your password
            </p>

            {message && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
                {message}
                <button
                  onClick={() => setMessage('📌 Check Render console for reset link if email not received.')}
                  className="ml-2 text-primary underline text-xs cursor-pointer"
                >
                  (Console help)
                </button>
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
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                Back to Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
