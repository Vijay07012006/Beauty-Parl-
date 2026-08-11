'use client';

import { useEffect, Suspense } from 'react';
import { useRouter, useSearchParams, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const { hydrate } = useAuthStore();

  useEffect(() => {
    const code = searchParams.get('code');

    if (!code) {
      router.push(`/${locale}/auth/login`);
      return;
    }

    (async () => {
      try {
        // Exchange the one-time code for a token server-side — never logs the JWT in the URL (H3)
        const { data } = await api.post('/auth/oauth/exchange', { code });
        const { access_token, user } = data;
        if (!access_token || !user) throw new Error('Invalid exchange response');
        localStorage.setItem('token', access_token);
        localStorage.setItem('user', JSON.stringify(user));
        hydrate();

        if (user.role === 'admin' || user.role === 'super_admin') {
          router.push(`/${locale}/admin/dashboard`);
        } else {
          router.push(`/${locale}`);
        }
      } catch (error) {
        console.error('OAuth exchange failed:', error);
        router.push(`/${locale}/auth/login`);
      }
    })();
  }, [searchParams, router, hydrate, locale]);

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
