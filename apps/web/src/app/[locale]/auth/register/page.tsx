'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { OtpModal } from '@/components/auth/OtpModal';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function RegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';
  const { register, loading, error } = useAuthStore();
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [registeredEmail, setRegisteredEmail] = useState('');
  const [registeredPhone, setRegisteredPhone] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formError, setFormError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }

    try {
      // ✅ Register user — backend creates account + sends OTP automatically
      const result = await register(name, email, password, phone);
      if (result.success) {
        // Show OTP modal on success
        setRegisteredEmail(email);
        setRegisteredPhone(phone);
        setShowOtpModal(true);
      }
      // If !success, error is already set in the store and displayed
    } catch (err) {
      setFormError('Registration failed. Please try again.');
    }
  };

  const handleOtpVerified = () => {
    setShowOtpModal(false);
    // ✅ After OTP verification, redirect to login page
    router.push(`/${locale}/auth/login?verified=true`);
  };

  const handleOtpClose = () => {
    setShowOtpModal(false);
    // User can still login later — account is created, just not verified
    router.push(`/${locale}/auth/login`);
  };

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h1 className="text-3xl font-playfair font-bold text-center mb-2">
              Create Account
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              Join the Beauty Parlé community
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              {(error || formError) && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                  {formError || error}
                </div>
              )}
              <div>
                <label className="block text-sm font-medium mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+91 98765 43210"
                  className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Password</label>
                <PasswordInput
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Confirm Password</label>
                <PasswordInput
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium disabled:opacity-50 cursor-pointer"
              >
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>

            <p className="text-center text-sm text-muted-foreground mt-6">
              Already have an account?{' '}
              <Link href={`/${locale}/auth/login`} className="text-primary hover:underline">
                Sign In
              </Link>
            </p>
          </div>
        </div>
      </main>

      {/* ✅ OTP Modal — shows on successful registration */}
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
