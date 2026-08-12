'use client';

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { Shield } from 'lucide-react';

interface TwoFactorModalProps {
  email: string;
  onVerified: () => void;
  onClose?: () => void;
}

export function TwoFactorModal({ email, onVerified, onClose }: TwoFactorModalProps) {
  const [token, setToken] = useState('');
  const { verify2faLogin, loading, error, clearError } = useAuthStore();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError('');
    clearError();

    if (token.length < 6) {
      setLocalError('Please enter a 6-digit code');
      return;
    }

    const result = await verify2faLogin(email, token);
    if (result.success) {
      onVerified();
    } else {
      setLocalError(result.error || 'Invalid 2FA code');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card p-8 rounded-3xl max-w-md w-full shadow-2xl border border-border/50 relative">
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-muted-foreground hover:text-foreground cursor-pointer text-xl leading-none"
            aria-label="Close"
          >
            ✕
          </button>
        )}

        <div className="flex flex-col items-center mb-6">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary mb-3">
            <Shield className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-playfair font-bold text-center">Two-Factor Authentication</h2>
          <p className="text-muted-foreground text-xs text-center mt-2">
            Enter the 6-digit verification code from your authenticator app for <strong>{email}</strong>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={8}
            value={token}
            onChange={(e) => setToken(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            className="w-full p-4 text-center text-2xl font-bold tracking-widest rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
            placeholder="000000"
            required
            autoFocus
          />

          {(localError || error) && (
            <p className="text-red-500 text-xs text-center font-medium">
              {localError || error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || token.length < 6}
            className="w-full py-4 bg-primary text-white rounded-full hover:bg-primary/90 transition-all font-medium disabled:opacity-50 cursor-pointer shadow-lg shadow-primary/25"
          >
            {loading ? 'Verifying...' : 'Verify & Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
