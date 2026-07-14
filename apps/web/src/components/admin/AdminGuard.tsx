'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export function AdminGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, hydrate } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    hydrate();
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/en/auth/login');
      } else if (user.role !== 'admin' && user.role !== 'super_admin') {
        router.push('/en');
      }
    }
  }, [user, loading, router]);

  if (loading || !user || (user.role !== 'admin' && user.role !== 'super_admin')) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return <>{children}</>;
}
