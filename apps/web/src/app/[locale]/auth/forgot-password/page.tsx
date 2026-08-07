'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';

export default function ForgotPasswordPage() {
  const router = useRouter();
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
      console.log('✅ Forgot password response:', response.data);
      
      if (response.data.success) {
        setMessage('✅ Reset link sent! Check your email (or console logs).');
        setEmail('');
      } else {
        setError('❌ ' + (response.data.message || 'Failed to send reset link.'));
      }
    } catch (err: any) {
      console.error('❌ Forgot password error:', err);
      // ✅ Show user-friendly error
      setError('❌ Failed to send reset link. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle fallback link from console
  const handleConsoleFallback = () => {
    setMessage('📌 Check the Render console for the reset link (email failed).');
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
                  onClick={handleConsoleFallback}
                  className="ml-2 text-primary underline text-xs cursor-pointer"
                >
                  (Check console)
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
              <a href="/en/auth/login" className="text-primary hover:underline">
                Back to Sign In
              </a>
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
