'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';

export default function ResetPasswordPage() {
  const params = useParams();
  const router = useRouter();
  const token = params?.token as string;

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!token) {
      setError('❌ Invalid reset link. Please request a new one.');
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    setLoading(true);
    setMessage('');
    setError('');

    try {
      await api.post('/auth/reset-password', { token, newPassword: password });
      setMessage('✅ Password reset successfully! Redirecting to login...');
      setTimeout(() => router.push('/en/auth/login?reset=success'), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Failed to reset password. Link may be expired.';
      setError('❌ ' + msg);
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
            <h1 className="text-3xl font-playfair font-bold text-center mb-6">Reset Password</h1>
            <p className="text-muted-foreground text-center mb-8">
              Enter your new password
            </p>

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
                <label className="block text-sm font-medium mb-1">New Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  placeholder="••••••••"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !token}
                className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Resetting...' : 'Reset Password'}
              </button>
            </form>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
