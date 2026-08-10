'use client';

import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, Sparkles } from 'lucide-react';

interface Look {
  id: number;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  occasion?: string;
  skinType?: string;
  productCount?: number;
}

interface LookCardProps {
  look: Look;
}

export function LookCard({ look }: LookCardProps) {
  return (
    <Link href={`/en/looks/${look.slug}`} className="group block h-full">
      <div className="bg-card rounded-3xl border border-border/40 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 flex flex-col h-full relative group">
        
        {/* Occasion / Badge */}
        {look.occasion && (
          <div className="absolute top-4 left-4 z-10 bg-white/80 backdrop-blur-md px-3 py-1 rounded-full border border-border/20 shadow-sm">
            <span className="text-[10px] font-bold text-primary tracking-wider uppercase flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-amber-500" />
              {look.occasion}
            </span>
          </div>
        )}

        {/* Product Count Pill */}
        {look.productCount !== undefined && (
          <div className="absolute top-4 right-4 z-10 bg-primary text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md">
            {look.productCount} Products
          </div>
        )}

        {/* Image Frame */}
        <div className="relative aspect-[4/3] w-full bg-secondary/10 overflow-hidden">
          {look.imageUrl ? (
            <Image
              src={look.imageUrl}
              alt={look.name}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-4xl bg-gradient-to-tr from-pink-50 to-amber-50">✨</div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        </div>

        {/* Look Content */}
        <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
          <div className="space-y-2">
            <h3 className="font-playfair font-bold text-xl leading-tight group-hover:text-primary transition-colors">
              {look.name}
            </h3>
            {look.skinType && (
              <span className="inline-block text-[10px] font-semibold text-muted-foreground bg-muted px-2 py-0.5 rounded-md">
                Skin Type: {look.skinType}
              </span>
            )}
            {look.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                {look.description}
              </p>
            )}
          </div>

          <div className="flex items-center text-primary font-bold text-sm group-hover:translate-x-1.5 transition-transform duration-300">
            Shop This Look
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </div>
        </div>
      </div>
    </Link>
  );
}
