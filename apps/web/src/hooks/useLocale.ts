'use client';

import { useParams, usePathname } from 'next/navigation';

export function useLocale(): string {
  const params = useParams();
  const pathname = usePathname();
  return (params?.locale as string) || pathname?.split('/')[1] || 'en';
}

export function localePath(locale: string, path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`;
  if (normalized.startsWith(`/${locale}/`) || normalized === `/${locale}`) {
    return normalized;
  }
  return `/${locale}${normalized}`;
}
