'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { TagFilterChips } from '@/components/products/TagFilterChips';
import { ProductCard } from '@/components/products/ProductCard';
import { Sparkles, Leaf } from 'lucide-react';

interface Tag {
  id: number;
  name: string;
  icon?: string;
  category?: 'ingredient' | 'benefit' | 'concern';
}

interface Product {
  id: number;
  name: string;
  brand?: string;
  description: string;
  price: number;
  mrp?: number;
  discountPercent?: number;
  image: string;
  category: string;
  stock: number;
  rating?: number;
  ratingCount?: number;
}

export default function CleanBeautyPage() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(true);

  // Fetch tags on mount
  useEffect(() => {
    async function fetchTags() {
      try {
        const res = await api.get('/product-tags');
        setTags(res.data);
        // Pre-select 'Vegan' and 'Cruelty-Free' if they exist to show some default Clean Beauty vibe
        const defaultSelected = res.data
          .filter((t: Tag) => t.name === 'Vegan' || t.name === 'Cruelty-Free')
          .map((t: Tag) => t.name);
        setSelectedTags(defaultSelected);
      } catch (err) {
        console.error('Error fetching tags:', err);
      } finally {
        setLoadingTags(false);
      }
    }
    fetchTags();
  }, []);

  // Fetch products when selected tags change
  useEffect(() => {
    async function fetchFilteredProducts() {
      setLoadingProducts(true);
      try {
        const tagsParam = selectedTags.length > 0 ? selectedTags.join(',') : '';
        const res = await api.get('/products', {
          params: {
            tags: tagsParam || undefined,
            limit: 40, // load more for catalog look
          }
        });
        setProducts(res.data.products || []);
      } catch (err) {
        console.error('Error fetching filtered products:', err);
      } finally {
        setLoadingProducts(false);
      }
    }
    fetchFilteredProducts();
  }, [selectedTags]);

  return (
    <>
      <Header />
      <main className="min-h-screen bg-gradient-to-b from-background via-emerald-50/10 to-background py-12">
        <div className="container mx-auto px-4 max-w-6xl space-y-12">
          
          {/* Hero Banner */}
          <div className="text-center max-w-2xl mx-auto space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-emerald-100 rounded-full text-xs font-bold text-emerald-700 tracking-wider uppercase">
              <Leaf className="w-3.5 h-3.5" />
              Clean & Conscious
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
              Ingredient Mapping
            </h1>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Transparent beauty designed for you. Filter by ingredients, benefits, and skin concerns to find your perfect clean match.
            </p>
          </div>

          {/* Tag Filter Chips Section */}
          <div className="bg-card rounded-3xl border border-border/40 p-6 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold tracking-wider uppercase text-muted-foreground">Filter by criteria</span>
              {selectedTags.length > 0 && (
                <button 
                  onClick={() => setSelectedTags([])}
                  className="text-xs text-primary hover:underline font-bold"
                >
                  Clear All
                </button>
              )}
            </div>
            {loadingTags ? (
              <div className="flex gap-2 py-2 overflow-x-auto">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="h-8 w-24 bg-secondary/20 animate-pulse rounded-full" />
                ))}
              </div>
            ) : (
              <TagFilterChips 
                tags={tags} 
                selectedTags={selectedTags} 
                onChange={setSelectedTags} 
              />
            )}
          </div>

          {/* Products Grid */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-playfair font-bold text-2xl">Clean Choices</h2>
              <span className="text-xs text-muted-foreground font-semibold">{products.length} Products found</span>
            </div>

            {loadingProducts ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] bg-card/60 animate-pulse rounded-3xl border border-border/40" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="text-center py-20 bg-card rounded-3xl border border-border/40 shadow-sm space-y-2">
                <Leaf className="w-10 h-10 text-muted-foreground mx-auto stroke-1" />
                <p className="text-muted-foreground text-sm font-semibold">No products found matching the selected tags.</p>
                <p className="text-xs text-muted-foreground">Try removing some tag filters.</p>
              </div>
            )}
          </div>

        </div>
      </main>
      <Footer />
    </>
  );
}
