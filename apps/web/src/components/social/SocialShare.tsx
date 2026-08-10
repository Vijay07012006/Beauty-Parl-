'use client';

import { Link as LinkIcon } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useLocale } from '@/hooks/useLocale';

interface SocialShareProps {
  productId: number;
  productName: string;
  productPrice: number;
  productImage?: string;
}

export function SocialShare({ productId, productName, productPrice, productImage }: SocialShareProps) {
  const locale = useLocale();

  const getShareUrl = (platform: string) => {
    const base = process.env.NEXT_PUBLIC_SOCIAL_SHARE_BASE || window.location.origin;
    return `${base}/${locale}/product/${productId}?source=${platform}`;
  };

  const trackClick = async (platform: string) => {
    try {
      await api.post('/social/track-click', { platform, productId });
    } catch (err) {
      console.error('Failed to log platform click:', err);
    }
  };

  const handleShare = async (platform: string) => {
    await trackClick(platform);
    const url = encodeURIComponent(getShareUrl(platform));
    const text = encodeURIComponent(`Check out the gorgeous ${productName} on Beauty Parlé!`);

    let targetUrl = '';
    if (platform === 'facebook') {
      targetUrl = `https://www.facebook.com/sharer/sharer.php?u=${url}`;
    } else if (platform === 'twitter') {
      targetUrl = `https://twitter.com/intent/tweet?url=${url}&text=${text}`;
    } else if (platform === 'whatsapp') {
      targetUrl = `https://api.whatsapp.com/send?text=${text}%20${url}`;
    }

    if (targetUrl) {
      window.open(targetUrl, '_blank', 'noopener,noreferrer');
    }
  };

  const copyLink = async () => {
    await trackClick('direct_link');
    const url = getShareUrl('direct');
    navigator.clipboard.writeText(url);
    toast.success('Link copied to clipboard! 📋');
  };

  return (
    <div className="space-y-3 bg-card p-4 sm:p-5 rounded-2xl border border-border/30 shadow-sm">
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground block">
        Share & Earn Rewards
      </span>
      <div className="flex items-center gap-2">
        <button
          onClick={() => handleShare('facebook')}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full transition cursor-pointer flex items-center justify-center"
          aria-label="Share on Facebook"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('twitter')}
          className="p-2.5 bg-neutral-900 hover:bg-black text-white rounded-full transition cursor-pointer flex items-center justify-center"
          aria-label="Share on X"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        </button>
        <button
          onClick={() => handleShare('whatsapp')}
          className="p-2.5 bg-green-500 hover:bg-green-600 text-white rounded-full transition cursor-pointer flex items-center justify-center"
          aria-label="Share on WhatsApp"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
            <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008 0c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.457L0 24zm6.59-4.846c1.6.95 3.188 1.449 4.825 1.451 5.436 0 9.86-4.42 9.864-9.855.002-2.63-1.023-5.101-2.887-6.968C16.578 1.916 14.105.89 11.472.889c-5.441 0-9.866 4.422-9.87 9.856-.002 1.802.483 3.568 1.406 5.166l-.999 3.648 3.737-.981-.199-.118z"/>
          </svg>
        </button>
        <button
          onClick={copyLink}
          className="p-2.5 bg-secondary text-foreground hover:bg-secondary/80 rounded-full transition cursor-pointer flex items-center justify-center"
          aria-label="Copy link"
        >
          <LinkIcon className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
