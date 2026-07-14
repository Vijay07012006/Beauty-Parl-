'use client';

import { useState } from 'react';
import { api } from '@/lib/api';

interface OtpModalProps {
  email: string;
  phone?: string;
  onVerified: () => void;
  onClose?: () => void;
}

export function OtpModal({ email, phone, onVerified, onClose }: OtpModalProps) {
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendMessage, setResendMessage] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      if (res.data.success) {
        onVerified();
      } else {
        setError('Invalid OTP. Please try again.');
      }
    } catch {
      setError('Invalid OTP. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setResendLoading(true);
    setResendMessage('');
    setError('');
    setOtp('');
    try {
      await api.post('/auth/send-otp', { email, phone });
      setResendMessage('✅ New OTP sent! Check your terminal.');
    } catch {
      setError('Failed to resend OTP. Please try again.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card p-8 rounded-3xl max-w-md w-full shadow-2xl border border-border/50 relative">
        {/* Close button */}
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        {/* Header */}
        <h2 className="text-3xl font-playfair font-bold mb-2 text-center">Verify Your Account</h2>
        <p className="text-sm text-muted-foreground text-center mb-3">
          Enter the 6-digit code for <span className="font-semibold text-foreground">{email}</span>
        </p>

        {/* Dev hint */}
        <div className="text-xs text-center text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-4 py-2 mb-5">
          💡 <strong>Dev mode:</strong> Check the <strong>NestJS terminal</strong> — look for:<br/>
          <code className="font-mono text-amber-800">📧 OTP for {email}: XXXXXX</code>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* OTP input */}
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
            className="w-full p-4 text-center text-3xl font-bold tracking-widest rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="000000"
            required
            autoFocus
          />

          {/* Error */}
          {error && <p className="text-red-500 text-sm text-center font-medium">{error}</p>}

          {/* Resend success */}
          {resendMessage && <p className="text-green-600 text-sm text-center font-medium">{resendMessage}</p>}

          {/* Verify button */}
          <button
            type="submit"
            disabled={loading || otp.length !== 6}
            className="w-full py-4 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/25"
          >
            {loading ? 'Verifying...' : 'Verify OTP'}
          </button>

          {/* Resend button */}
          <button
            type="button"
            onClick={handleResend}
            disabled={resendLoading}
            className="w-full py-2 text-sm text-primary hover:underline disabled:opacity-50 cursor-pointer transition-colors"
          >
            {resendLoading ? 'Sending...' : "Didn't receive the code? Resend OTP"}
          </button>
        </form>
      </div>
    </div>
  );
}
