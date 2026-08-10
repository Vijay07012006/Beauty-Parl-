'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';
import { RecommendationsSection } from '@/components/products/RecommendationsSection';
import { RecentlyViewed } from '@/components/recently-viewed/RecentlyViewed';
import Link from 'next/link';
import Image from 'next/image';

// Lazy load heavy sections
const Categories = dynamic(() => import('@/components/home/Categories').then(m => m.Categories), { 
  ssr: false,
  loading: () => <div className="py-16 text-center text-muted-foreground animate-pulse">Loading categories...</div>
});

const FeaturedProducts = dynamic(() => import('@/components/home/FeaturedProducts').then(m => m.FeaturedProducts), {
  ssr: false,
  loading: () => <div className="py-16 text-center text-muted-foreground animate-pulse">Loading products...</div>
});

export default function HomePage() {
  const [showSections, setShowSections] = useState(false);
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setShowSections(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );

    if (sectionRef.current) {
      observer.observe(sectionRef.current);
    }

    return () => observer.disconnect();
  }, []);

  return (
    <>
      <Header />
      <main>
        <Hero />
        <div ref={sectionRef}>
          {showSections ? (
            <>
              <Categories />
              
              {/* Curated Looks Banner */}
              <div className="bg-card py-16 border-t border-b border-border/30 my-8">
                <div className="container mx-auto px-4 max-w-6xl flex flex-col md:flex-row items-center justify-between gap-10">
                  <div className="space-y-4 max-w-lg">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-[10px] font-bold text-primary tracking-wider uppercase">
                      ✨ Style Guide
                    </div>
                    <h2 className="text-3xl md:text-4xl font-playfair font-bold tracking-tight">
                      Shop by Look & Curated Routines
                    </h2>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Get inspired by our expert-recommended styles and beauty routines. From "Date Night Glam" to "Dewy Skin Glow", grab everything you need in one click.
                    </p>
                    <Link href="/en/looks" className="inline-block mt-2">
                      <button className="px-6 py-3 bg-primary hover:bg-primary/95 text-white rounded-full font-bold text-xs transition shadow-md cursor-pointer select-none">
                        Explore Curated Looks
                      </button>
                    </Link>
                  </div>
                  <div className="relative w-full md:w-1/2 aspect-[16/10] rounded-3xl overflow-hidden shadow-lg border border-border/20">
                    <Image
                      src="https://images.unsplash.com/photo-1487412912498-0447578fcca8?w=800&q=80"
                      alt="Curated Looks Banner"
                      fill
                      className="object-cover"
                      sizes="(max-width: 768px) 100vw, 50vw"
                    />
                  </div>
                </div>
              </div>

              <FeaturedProducts />
              <div className="container mx-auto px-4 max-w-6xl pb-16">
                <RecommendationsSection type="personalized" limit={4} />
                <RecentlyViewed />
              </div>
            </>
          ) : (
            <div className="py-16 text-center text-muted-foreground">Scroll to load content...</div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
