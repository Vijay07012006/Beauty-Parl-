'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { LookCard } from '@/components/looks/LookCard';
import { Sparkles } from 'lucide-react';

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

export default function LooksPage() {
  const [looks, setLooks] = useState<Look[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeFilter, setActiveFilter] = useState('All');

  useEffect(() => {
    async function fetchLooks() {
      try {
        const res = await api.get('/looks');
        setLooks(res.data);
      } catch (err) {
        console.error('Error fetching looks:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchLooks();
  }, []);

  const occasions = ['All', ...new Set(looks.map(l => l.occasion).filter(Boolean) as string[])];

  const filteredLooks = activeFilter === 'All' 
    ? looks 
    : looks.filter(l => l.occasion === activeFilter);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12">
        <div className="container mx-auto px-4 max-w-6xl">
          
          {/* Hero Section */}
          <div className="text-center max-w-2xl mx-auto mb-16 space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary tracking-wider uppercase">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 animate-spin" />
              Shop by Look
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
              Curated Beauty Routines
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Discover themed collections and expertly curated looks. Shop individual products or get the complete setup with a single click.
            </p>
          </div>

          {/* Filter Bar */}
          <div className="flex gap-2.5 pb-8 overflow-x-auto no-scrollbar justify-start md:justify-center border-b border-border/40 mb-10">
            {occasions.map((occ) => (
              <button
                key={occ}
                onClick={() => setActiveFilter(occ)}
                className={`px-5 py-2.5 rounded-full text-xs font-bold transition-all duration-300 border shadow-sm cursor-pointer select-none
                  ${activeFilter === occ 
                    ? 'bg-primary border-primary text-white shadow-md' 
                    : 'bg-card border-border/50 text-foreground hover:bg-secondary/40'
                  }`}
              >
                {occ}
              </button>
            ))}
          </div>

          {/* Looks Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="aspect-[4/5] bg-card/60 animate-pulse rounded-3xl border border-border/40" />
              ))}
            </div>
          ) : filteredLooks.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredLooks.map((look) => (
                <LookCard key={look.id} look={look} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20 bg-card rounded-3xl border border-border/40 shadow-sm">
              <p className="text-muted-foreground text-sm font-medium">No looks found for this category.</p>
            </div>
          )}

        </div>
      </main>
      <Footer />
    </>
  );
}
