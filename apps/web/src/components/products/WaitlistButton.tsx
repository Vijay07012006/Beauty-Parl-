'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Mail, Check } from 'lucide-react';
import { useRouter, useParams } from 'next/navigation';

interface WaitlistButtonProps {
  productId: number;
  className?: string;
}

export function WaitlistButton({ productId, className = '' }: WaitlistButtonProps) {
  const { user } = useAuthStore();
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';

  const [loading, setLoading] = useState(false);
  const [onWaitlist, setOnWaitlist] = useState(false);

  useEffect(() => {
    if (!user || !productId) return;

    api.get(`/waitlist/${productId}`)
      .then((res) => {
        setOnWaitlist(res.data.onWaitlist);
      })
      .catch(() => {});
  }, [productId, user]);

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      toast.error('Please sign in to join the restock waitlist');
      router.push(`/${locale}/auth/login?redirect=product/${productId}`);
      return;
    }

    setLoading(true);
    try {
      await api.post(`/waitlist/${productId}`);
      setOnWaitlist(true);
      toast.success('🎉 You have joined the waitlist! We will email you the moment stock returns.');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to join waitlist. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (onWaitlist) {
    return (
      <button
        disabled
        className={`w-full py-4 bg-emerald-50 text-emerald-700 border border-emerald-200 font-bold rounded-full flex items-center justify-center gap-2 select-none ${className}`}
      >
        <Check size={16} /> On Waitlist (We'll Email You!)
      </button>
    );
  }

  return (
    <button
      onClick={handleJoin}
      disabled={loading}
      className={`w-full py-4 bg-neutral-900 text-white font-bold rounded-full hover:bg-neutral-800 transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md select-none ${className}`}
    >
      <Mail size={16} /> Notify Me on Restock
    </button>
  );
}
