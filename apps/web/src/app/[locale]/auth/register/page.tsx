'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { PasswordInput } from '@/components/ui/PasswordInput';

export default function RegisterPage() {
  const router = useRouter();
  const { register, loading, error, sendOtp } = useAuthStore();
  const [step, setStep] = useState<'register' | 'otp'>('register');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpError, setOtpError] = useState('');
  const [otpLoading, setOtpLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (password !== confirmPassword) {
      setFormError('Passwords do not match');
      return;
    }
    
    // First, register the user (inactive/unverified)
    await register(name, email, password, phone);
    if (!useAuthStore.getState().error) {
      // Send OTP
      setOtpLoading(true);
      try {
        const sent = await sendOtp(email, phone);
        if (sent) {
          setStep('otp');
        } else {
          setOtpError('Failed to send OTP. Please try again.');
        }
      } finally {
        setOtpLoading(false);
      }
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpLoading(true);
    setOtpError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        // Auto-login after OTP verification
        await useAuthStore.getState().login(email, password);
        router.push('/en');
      } else {
        setOtpError('Invalid OTP');
      }
    } catch (err) {
      setOtpError('Failed to verify OTP');
    } finally {
      setOtpLoading(false);
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-[80vh] flex items-center justify-center py-12">
        <div className="w-full max-w-md mx-auto px-4">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h1 className="text-3xl font-playfair font-bold text-center mb-2">
              {step === 'register' ? 'Create Account' : 'Verify OTP'}
            </h1>
            <p className="text-muted-foreground text-center mb-6">
              {step === 'register' 
                ? 'Join the Beauty Parlé community' 
                : (
                  <>
                    Code sent to <strong>{email}</strong>.<br/>
                    <span className="text-amber-600 font-medium">💡 Check the NestJS terminal for: 📧 OTP for {email}: XXXXXX</span>
                  </>
                )}
            </p>

            {step === 'register' ? (
              <form onSubmit={handleRegister} className="space-y-4">
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
                  {loading ? 'Creating...' : 'Create Account'}
                </button>
              </form>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                {otpError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                    {otpError}
                  </div>
                )}
                <div>
                  <label className="block text-sm font-medium mb-1">OTP Code</label>
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    required
                    className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 text-center text-2xl tracking-widest"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  Didn't receive the code?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setOtpError('');
                      sendOtp(email, phone);
                    }}
                    className="text-primary hover:underline cursor-pointer"
                  >
                    Resend
                  </button>
                </p>
                <button
                  type="submit"
                  disabled={otpLoading}
                  className="w-full py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition font-medium disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? 'Verifying...' : 'Verify OTP'}
                </button>
              </form>
            )}

            <p className="text-center text-sm text-muted-foreground mt-6">
              {step === 'register' ? (
                <>
                  Already have an account?{' '}
                  <Link href="/en/auth/login" className="text-primary hover:underline">
                    Sign In
                  </Link>
                </>
              ) : (
                <button
                  type="button"
                  onClick={() => setStep('register')}
                  className="text-primary hover:underline cursor-pointer"
                >
                  Back to registration
                </button>
              )}
            </p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
