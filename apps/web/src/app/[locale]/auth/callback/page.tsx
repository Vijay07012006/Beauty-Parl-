'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { hydrate } = useAuthStore();

  useEffect(() => {
    const token = searchParams.get('token');
    const user = searchParams.get('user');

    if (token && user) {
      try {
        const userData = JSON.parse(decodeURIComponent(user));
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify(userData));
        hydrate();
        
        if (userData.role === 'admin' || userData.role === 'super_admin') {
          router.push('/en/admin/dashboard');
        } else {
          router.push('/en');
        }
      } catch (error) {
        console.error('Failed to parse user data:', error);
        router.push('/en/auth/login');
      }
    } else {
      router.push('/en/auth/login');
    }
  }, [searchParams, router, hydrate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-secondary/10">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent mx-auto" />
        <p className="text-muted-foreground text-sm font-medium">Logging you in...</p>
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-secondary/10">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent" />
      </div>
    }>
      <CallbackHandler />
    </Suspense>
  );
}
