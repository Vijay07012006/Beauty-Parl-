'use client';

import Link from 'next/link';
import { ShoppingBag } from 'lucide-react';

export function TikTokShopButton() {
  const feedUrl = `${process.env.NEXT_PUBLIC_API_URL || 'https://beauty-parle-api.onrender.com'}/tiktok/feed`;

  return (
    <Link 
      href={feedUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 px-4 py-2 bg-[#000000] text-white hover:bg-neutral-900 rounded-full text-xs font-bold transition-all shadow-md active:scale-95 group border border-neutral-800"
    >
      {/* TikTok SVG Icon */}
      <svg 
        className="w-4 h-4 text-white group-hover:animate-pulse" 
        fill="currentColor" 
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path d="M12.53.02C13.84 0 15.14.01 16.44 0c.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.17-2.89-.6-4.09-1.5-.77-.58-1.41-1.35-1.89-2.23v9.89c-.04 2.22-.84 4.54-2.54 6.01-1.63 1.45-3.95 2-6.07 1.83-2.2-.18-4.43-1.32-5.59-3.23-1.3-2.09-1.48-4.88-.47-7.01.99-2.14 3.12-3.72 5.48-3.99 1.13-.13 2.27.02 3.34.42v4.23c-1.07-.63-2.43-.81-3.62-.31-1.16.49-2.01 1.68-2.2 2.93-.24 1.54.49 3.18 1.83 3.94 1.34.78 3.11.66 4.3-.31.81-.66 1.25-1.7 1.25-2.75V.02z"/>
      </svg>
      <span>TikTok Feed</span>
    </Link>
  );
}
