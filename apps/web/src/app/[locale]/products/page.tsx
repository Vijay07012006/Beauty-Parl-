'use client';

import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { ProductCard } from '@/components/products/ProductCard';
import { CategoryFilter } from '@/components/products/CategoryFilter';
import { SearchBar } from '@/components/products/SearchBar';
import { InfiniteScroll } from '@/components/products/InfiniteScroll';
import { ProductSkeleton } from '@/components/ui/ProductSkeleton';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

function ProductsContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale || 'en';

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Filters State
  const [category, setCategory] = useState(searchParams?.get('category') || 'all');
  const [brand, setBrand] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [rating, setRating] = useState(0);
  const [search, setSearch] = useState(searchParams?.get('search') || '');

  // Sync state when URL params change
  useEffect(() => {
    const cat = searchParams?.get('category') || 'all';
    const q = searchParams?.get('search') || '';
    setCategory(cat);
    setSearch(q);
    
    // Reset state for new search
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
  }, [searchParams]);

  // Fetch products from database
  const fetchProducts = async (pageNum: number, isInitial = false) => {
    setLoading(true);
    try {
      const paramsObj: any = {
        page: pageNum,
        limit: 12,
        category: category !== 'all' ? category : undefined,
        brand: brand !== 'all' ? brand : undefined,
        minPrice: minPrice ? parseFloat(minPrice) : undefined,
        maxPrice: maxPrice ? parseFloat(maxPrice) : undefined,
        rating: rating > 0 ? rating : undefined,
        search: search || undefined
      };

      const res = await api.get('/products', { params: paramsObj });
      const items = res.data?.data || res.data || [];
      const total = res.data?.total || items.length;

      if (isInitial) {
        setProducts(items);
      } else {
        setProducts(prev => {
          const ids = new Set(prev.map(p => p.id));
          const filtered = items.filter((i: any) => !ids.has(i.id));
          return [...prev, ...filtered];
        });
      }

      // Check if more items are available
      setHasMore(products.length + items.length < total && items.length > 0);
    } catch (err) {
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
      setInitialLoading(false);
    }
  };

  // Re-fetch products when filter keys change
  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setInitialLoading(true);
    fetchProducts(1, true);
  }, [category, brand, minPrice, maxPrice, rating, search]);

  // Infinite Scroll Trigger
  const handleLoadMore = () => {
    if (!loading && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchProducts(nextPage, false);
    }
  };

  const handleClearFilters = () => {
    setCategory('all');
    setBrand('all');
    setMinPrice('');
    setMaxPrice('');
    setRating(0);
    setSearch('');
  };

  return (
    <main className="min-h-screen py-8 bg-secondary/10">
      <div className="container mx-auto px-4">
        {/* Search Bar Wrapper */}
        <div className="mb-10">
          <SearchBar initialQuery={search} />
        </div>

        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="w-full lg:w-1/4 flex-shrink-0">
            <CategoryFilter
              selectedCategory={category}
              onCategoryChange={setCategory}
              minPrice={minPrice}
              onMinPriceChange={setMinPrice}
              maxPrice={maxPrice}
              onMaxPriceChange={setMaxPrice}
              selectedRating={rating}
              onRatingChange={setRating}
              selectedBrand={brand}
              onBrandChange={setBrand}
              onClear={handleClearFilters}
            />
          </aside>

          {/* Product Listing Area */}
          <div className="flex-1 space-y-6">
            <div className="flex items-center justify-between bg-card px-6 py-4 rounded-2xl border border-border/50">
              <h2 className="text-xl font-bold font-playfair">
                {category !== 'all' ? `${category} Collection` : 'All Products'}
              </h2>
              <span className="text-xs text-muted-foreground font-semibold uppercase tracking-wider">
                {products.length} Products Loaded
              </span>
            </div>

            {initialLoading ? (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, idx) => (
                  <ProductSkeleton key={idx} />
                ))}
              </div>
            ) : products.length === 0 ? (
              <div className="text-center py-16 px-6 bg-card rounded-3xl border border-border/50 space-y-4">
                <span className="text-5xl block select-none">💄</span>
                <h3 className="text-lg font-bold">No Products Found</h3>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filter parameters or search terms.
                </p>
                <button
                  onClick={handleClearFilters}
                  className="px-6 py-2 text-xs font-bold bg-primary text-white rounded-full hover:bg-primary/90 transition-all cursor-pointer"
                >
                  Clear Filters
                </button>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                <InfiniteScroll
                  hasMore={hasMore}
                  loading={loading}
                  onLoadMore={handleLoadMore}
                />
              </>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function ProductsPage() {
  return (
    <>
      <Header />
      <Suspense fallback={
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-lg font-medium text-primary">Loading products catalog...</div>
        </main>
      }>
        <ProductsContent />
      </Suspense>
      <Footer />
    </>
  );
}
