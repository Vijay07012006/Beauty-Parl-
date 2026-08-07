'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OtpModal } from '@/components/auth/OtpModal';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, clearError } = useAuthStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  });

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const result = await register(form.name, form.email, form.password, form.phone);
    if (result.success) {
      setRegisteredEmail(form.email);
      setRegisteredPhone(form.phone);
      setShowOtpModal(true);
    }
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    router.push('/en/auth/login?verified=true');
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
    router.push('/en/auth/login?message=Please verify your email before logging in');
  };

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h1 className="text-3xl font-playfair font-bold text-center mb-6">Create Account</h1>
            <p className="text-muted-foreground text-center mb-8">Join the Beauty Parlé community</p>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm({...form, name: e.target.value})}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({...form, email: e.target.value})}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(e) => setForm({...form, phone: e.target.value})}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <input
                  type="password"
                  value={form.password}
                  onChange={(e) => setForm({...form, password: e.target.value})}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  required
                  minLength={6}
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <input
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) => setForm({...form, confirmPassword: e.target.value})}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium disabled:opacity-50"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <a href="/en/auth/login" className="text-primary hover:underline">
                Sign In
              </a>
            </p>
          </div>
        </div>
      </main>

      {showOtpModal && (
        <OtpModal
          email={registeredEmail}
          phone={registeredPhone}
          onVerified={handleOtpVerified}
          onClose={handleOtpClose}
        />
      )}
      <Footer />
    </>
  );
}
