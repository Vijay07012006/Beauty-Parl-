'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Hero } from '@/components/home/Hero';

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
              <FeaturedProducts />
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
