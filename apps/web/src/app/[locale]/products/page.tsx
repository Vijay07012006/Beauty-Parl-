'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { SearchBar } from '@/components/search/SearchBar';
import { FilterSidebar } from '@/components/search/FilterSidebar';
import { WishlistButton } from '@/components/products/WishlistButton';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingCart, SlidersHorizontal } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discountPercent?: number;
  mrp?: number;
  image: string;
  category: string;
  stock: number;
  rating: number;
  ratingCount?: number;
}

export default function ProductsPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = (params?.locale as string) || 'en';

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  const lastProductRef = useRef<HTMLDivElement | null>(null);
  const { addItem } = useCartStore();

  const categories = ['Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Tools'];

  // Current filters from URL search params
  const currentCategory = searchParams.get('category') || '';
  const currentSearch = searchParams.get('search') || '';
  const currentMinPrice = searchParams.get('minPrice') || '';
  const currentMaxPrice = searchParams.get('maxPrice') || '';
  const currentMinRating = searchParams.get('minRating') || '';
  const currentSort = searchParams.get('sort') || 'newest';

  const fetchProducts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    setLoading(true);
    try {
      const queryParams = new URLSearchParams();
      queryParams.set('page', String(pageNum));
      queryParams.set('limit', '12');
      if (currentCategory) queryParams.set('category', currentCategory);
      if (currentSearch) queryParams.set('search', currentSearch);
      if (currentMinPrice) queryParams.set('minPrice', currentMinPrice);
      if (currentMaxPrice) queryParams.set('maxPrice', currentMaxPrice);
      if (currentMinRating) queryParams.set('minRating', currentMinRating);
      if (currentSort) queryParams.set('sort', currentSort);

      const response = await api.get(`/products?${queryParams.toString()}`);
      const newProducts = response.data.products || [];

      if (newProducts.length === 0) {
        setHasMore(false);
        if (isInitial) {
          setProducts([]);
        }
      } else {
        setProducts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return isInitial ? newProducts : [...prevArray, ...newProducts];
        });
        setHasMore(response.data.hasMore ?? (newProducts.length >= 12));
      }
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  }, [
    currentCategory,
    currentSearch,
    currentMinPrice,
    currentMaxPrice,
    currentMinRating,
    currentSort
  ]);

  // When filters or search change, reset page to 1 and reload
  useEffect(() => {
    setPage(1);
    setHasMore(true);
    fetchProducts(1, true);
  }, [
    currentCategory,
    currentSearch,
    currentMinPrice,
    currentMaxPrice,
    currentMinRating,
    currentSort,
    fetchProducts
  ]);

  // Infinite scroll listener
  useEffect(() => {
    if (loading || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage(prev => prev + 1);
        }
      },
      { threshold: 0.5 }
    );

    const currentRef = lastProductRef.current;
    if (currentRef) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [loading, hasMore]);

  // Fetch next page
  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, false);
    }
  }, [page, fetchProducts]);

  const handleFilterChange = (newFilters: any) => {
    const queryParams = new URLSearchParams();
    if (currentSearch) queryParams.set('search', currentSearch);
    
    Object.keys(newFilters).forEach(key => {
      if (newFilters[key]) {
        queryParams.set(key, newFilters[key]);
      }
    });

    router.push(`/${locale}/products?${queryParams.toString()}`);
    setShowMobileFilters(false);
  };

  const handleSearch = (query: string) => {
    const queryParams = new URLSearchParams(searchParams.toString());
    if (query.trim()) {
      queryParams.set('search', query.trim());
    } else {
      queryParams.delete('search');
    }
    router.push(`/${locale}/products?${queryParams.toString()}`);
  };

  const handleAddToCart = (product: Product, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (product.stock <= 0) {
      toast.error('Product is out of stock');
      return;
    }

    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: product.image,
      maxStock: product.stock,
      quantity: 1,
    });
    toast.success(`🛒 Added ${product.name} to cart!`);
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-8 md:py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-6xl space-y-8">
          
          {/* Header & Search block */}
          <div className="bg-card rounded-3xl border border-border/50 p-6 md:p-8 shadow-sm space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl md:text-4xl font-playfair font-bold text-foreground">
                  Our Collection
                </h1>
                <p className="text-sm text-muted-foreground mt-1">
                  Discover clean beauty curated just for you
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="md:hidden flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-background hover:bg-secondary text-sm font-semibold cursor-pointer select-none"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                </button>
              </div>
            </div>

            {/* Search Bar Component */}
            <div className="max-w-2xl">
              <SearchBar initialQuery={currentSearch} onSearch={handleSearch} />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            
            {/* Sidebar Filters (Desktop) */}
            <div className="hidden md:block md:col-span-1">
              <FilterSidebar categories={categories} onFilterChange={handleFilterChange} />
            </div>

            {/* Mobile Filters Modal */}
            <AnimatePresence>
              {showMobileFilters && (
                <div className="fixed inset-0 z-50 md:hidden bg-background/80 backdrop-blur-md">
                  <div className="absolute inset-y-0 left-0 w-80 bg-card p-6 shadow-xl border-r border-border/50 overflow-y-auto space-y-6">
                    <div className="flex items-center justify-between">
                      <h3 className="font-playfair font-bold text-lg text-foreground">Filters</h3>
                      <button
                        onClick={() => setShowMobileFilters(false)}
                        className="text-xs text-muted-foreground hover:text-foreground cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                    <FilterSidebar categories={categories} onFilterChange={handleFilterChange} />
                  </div>
                </div>
              )}
            </AnimatePresence>

            {/* Product Grid Area */}
            <div className="md:col-span-3 space-y-6">
              
              {loading && products.length === 0 ? (
                <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="animate-pulse bg-card rounded-3xl p-5 border border-border/50 space-y-4">
                      <div className="aspect-square bg-secondary/50 rounded-2xl w-full" />
                      <div className="h-4 bg-secondary/50 rounded w-2/3" />
                      <div className="h-4 bg-secondary/50 rounded w-1/3" />
                      <div className="h-9 bg-secondary/50 rounded-full w-full" />
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="text-center py-20 bg-card border border-border/50 rounded-3xl space-y-4">
                  <span className="text-5xl block select-none">🔍</span>
                  <h3 className="text-xl font-playfair font-bold">No products found</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto">
                    We couldn't find any products matching your current search or filter criteria. Try adjusting your filters.
                  </p>
                </div>
              ) : (
                <>
                  <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {products.map((product, index) => {
                      const isLast = index === products.length - 1;
                      const discount = product.discountPercent || 0;
                      const displayMrp = product.mrp || product.price;

                      return (
                        <motion.div
                          key={product.id}
                          ref={isLast ? lastProductRef : null}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (index % 3) * 0.04 }}
                          className="group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-border/50 flex flex-col relative"
                        >
                          <Link href={`/${locale}/product/${product.id}`} className="flex flex-col h-full">
                            {/* Image with overlay Wishlist button */}
                            <div className="relative aspect-square w-full bg-secondary/10 overflow-hidden">
                              {product.image ? (
                                <Image
                                  src={product.image}
                                  alt={product.name}
                                  fill
                                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-5xl">💄</div>
                              )}
                              
                              {discount > 0 && (
                                <div className="absolute top-3 left-3 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider">
                                  {discount}% OFF
                                </div>
                              )}

                              {/* Wishlist Heart Overlay */}
                              <div className="absolute top-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity">
                                <WishlistButton
                                  item={{
                                    id: product.id,
                                    name: product.name,
                                    price: Number(product.price),
                                    mrp: product.mrp ? Number(product.mrp) : undefined,
                                    discountPercent: product.discountPercent,
                                    image: product.image,
                                    rating: product.rating,
                                    ratingCount: product.ratingCount,
                                    stock: product.stock
                                  }}
                                />
                              </div>
                            </div>

                            {/* Product Info */}
                            <div className="p-4 md:p-5 flex-1 flex flex-col justify-between space-y-3">
                              <div className="space-y-1">
                                <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">
                                  {product.category}
                                </p>
                                <h3 className="font-semibold text-sm md:text-base leading-tight group-hover:text-primary transition-colors line-clamp-1">
                                  {product.name}
                                </h3>
                              </div>

                              <div className="space-y-2">
                                <div className="flex items-baseline gap-2">
                                  <span className="font-bold text-primary text-sm md:text-base">
                                    ${Number(product.price).toFixed(2)}
                                  </span>
                                  {discount > 0 && (
                                    <span className="text-xs text-muted-foreground line-through">
                                      ${Number(displayMrp).toFixed(2)}
                                    </span>
                                  )}
                                </div>

                                <button
                                  onClick={(e) => handleAddToCart(product, e)}
                                  disabled={product.stock <= 0}
                                  className="w-full py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition-all active:scale-95 disabled:opacity-50 cursor-pointer font-bold text-xs md:text-sm flex items-center justify-center gap-1.5"
                                >
                                  <ShoppingCart size={14} />
                                  Add to Cart
                                </button>
                              </div>
                            </div>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>

                  {loading && products.length > 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm font-medium">
                      Loading more products...
                    </div>
                  )}

                  {!hasMore && products.length > 0 && (
                    <div className="text-center py-10 text-muted-foreground text-xs md:text-sm font-medium">
                      — You've seen all products —
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
