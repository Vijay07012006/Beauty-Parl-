'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Ticket, X, Loader2 } from 'lucide-react';

interface CouponInputProps {
  onCouponApplied: (result: any) => void;
  onCouponRemoved: () => void;
  orderTotal: number;
}

export function CouponInput({ onCouponApplied, onCouponRemoved, orderTotal }: CouponInputProps) {
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [applied, setApplied] = useState(false);

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    setLoading(true);
    setError('');
    try {
      const response = await api.post('/coupons/validate', {
        code: code.trim(),
        orderTotal,
      });
      if (response.data.valid) {
        setApplied(true);
        onCouponApplied(response.data);
      }
    } catch (err: any) {
      setError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = () => {
    setCode('');
    setApplied(false);
    setError('');
    onCouponRemoved();
  };

  if (applied) {
    return (
      <div className="flex items-center justify-between bg-emerald-50/50 border border-emerald-100 rounded-xl p-3.5 transition-all">
        <div className="flex items-center gap-2">
          <Ticket size={18} className="text-emerald-600 animate-bounce" />
          <span className="text-xs font-semibold text-emerald-800">Coupon successfully applied!</span>
        </div>
        <button
          onClick={handleRemove}
          className="text-emerald-600 hover:text-emerald-800 p-1 hover:bg-emerald-50 rounded-full transition-colors cursor-pointer"
          aria-label="Remove coupon"
        >
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <form onSubmit={handleApply} className="flex gap-2">
        <div className="flex-1 relative">
          <Ticket size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            placeholder="Enter coupon code"
            className="w-full pl-9 pr-3 py-2 rounded-xl border border-input bg-background text-xs text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all font-mono tracking-wider font-bold"
            disabled={loading}
          />
        </div>
        <button
          type="submit"
          disabled={loading || !code.trim()}
          className="px-4 py-2 bg-primary text-white rounded-xl hover:bg-primary/95 transition-all font-bold text-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
        >
          {loading ? <Loader2 size={12} className="animate-spin" /> : 'Apply'}
        </button>
      </form>
      {error && <p className="text-xs text-red-500 font-semibold pl-1">⚠️ {error}</p>}
    </div>
  );
}
