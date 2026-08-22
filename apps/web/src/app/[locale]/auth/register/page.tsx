'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OtpModal } from '@/components/auth/OtpModal';
import { SocialLoginButtons } from '@/components/auth/SocialLoginButtons';
import { useLocale } from '@/hooks/useLocale';
import { PasswordStrengthMeter } from '@/components/auth/PasswordStrengthMeter';

export default function RegisterPage() {
  const router = useRouter();
  const locale = useLocale();
  const { register, loading, error, clearError } = useAuthStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const searchParams = useSearchParams();
  const refCode = searchParams?.get('ref') || '';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    referralCode: refCode,
  });

  useEffect(() => {
    if (refCode) {
      setForm((prev) => ({ ...prev, referralCode: refCode }));
    }
  }, [refCode]);

  useEffect(() => {
    clearError();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (form.password !== form.confirmPassword) {
      alert('Passwords do not match');
      return;
    }

    const result = await register(form.name, form.email, form.password, form.phone, form.referralCode || undefined);
    if (result.success) {
      setRegisteredEmail(form.email);
      setRegisteredPhone(form.phone);
      setShowOtpModal(true);
    }
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    router.push(`/${locale}/auth/login?verified=true`);
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
    router.push(`/${locale}/auth/login?message=Please verify your email before logging in`);
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
                <PasswordStrengthMeter password={form.password} />
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
              <div>
                <label className="block text-sm font-medium mb-1">Referral Code (Optional)</label>
                <input
                  type="text"
                  value={form.referralCode}
                  placeholder="REF-XXXX-XXXX"
                  onChange={(e) => setForm({...form, referralCode: e.target.value})}
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
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

            <SocialLoginButtons redirectPath="/" />

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                Sign In
              </Link>
            </p>

            <div className="mt-6 pt-6 border-t border-border/80 text-center space-y-3">
              <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Business Partner Portals</p>
              <div className="flex gap-2 justify-center">
                <Link
                  href={`/${locale}/wholesale/login`}
                  className="px-4 py-2 border border-zinc-800 hover:border-primary/50 bg-secondary/10 hover:bg-secondary/20 rounded-xl text-xs font-semibold transition"
                >
                  💼 B2B Wholesale Login
                </Link>
                <Link
                  href={`/${locale}/vendor/register`}
                  className="px-4 py-2 border border-zinc-800 hover:border-primary/50 bg-secondary/10 hover:bg-secondary/20 rounded-xl text-xs font-semibold transition"
                >
                  🤝 Join as Vendor
                </Link>
              </div>
            </div>
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
