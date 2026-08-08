'use client';

import { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Heart, ShoppingCart } from 'lucide-react';

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
}

export default function ProductsPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const lastProductRef = useRef<HTMLDivElement | null>(null);

  const categories = ['All', 'Makeup', 'Skincare', 'Haircare', 'Fragrance', 'Tools'];

  const fetchProducts = async (pageNum: number, category: string = '') => {
    try {
      const url = `/products?page=${pageNum}&limit=12${category ? `&category=${category}` : ''}`;
      const response = await api.get(url);
      const newProducts = Array.isArray(response.data.products) ? response.data.products : [];
      
      if (newProducts.length === 0) {
        setHasMore(false);
      } else {
        setProducts(prev => {
          const prevArray = Array.isArray(prev) ? prev : [];
          return pageNum === 1 ? newProducts : [...prevArray, ...newProducts];
        });
        setHasMore(response.data.hasMore ?? (newProducts.length >= 12));
      }
    } catch (error) {
      console.error('❌ Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setProducts([]);
    setPage(1);
    setHasMore(true);
    setLoading(true);
    fetchProducts(1, selectedCategory);
  }, [selectedCategory]);

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
  }, [loading, hasMore, products]);

  useEffect(() => {
    if (page > 1) {
      fetchProducts(page, selectedCategory);
    }
  }, [page]);

  const productsArray = Array.isArray(products) ? products : [];
  const filteredProducts = productsArray.filter(p => 
    p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <>
      <Header />
      <main className="min-h-screen py-8 md:py-12 bg-background">
        <div className="container mx-auto px-4">
          {/* Search and Filter Bar */}
          <div className="flex flex-col md:flex-row gap-4 mb-8">
            <input
              type="text"
              placeholder="Search products..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 px-4 py-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50 text-foreground outline-none"
            />
            <div className="flex gap-2 overflow-x-auto pb-2">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat === 'All' ? '' : cat)}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors cursor-pointer ${
                    (cat === 'All' && !selectedCategory) || selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-secondary text-secondary-foreground hover:bg-primary/20'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {loading && products.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-card rounded-2xl p-4">
                  <div className="h-48 bg-secondary/50 rounded-xl mb-4" />
                  <div className="h-4 bg-secondary/50 rounded w-3/4 mb-2" />
                  <div className="h-4 bg-secondary/50 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {filteredProducts.map((product, index) => {
                  const isLast = index === filteredProducts.length - 1;
                  const discount = product.discountPercent || 0;
                  const displayMrp = product.mrp || product.price;

                  return (
                    <motion.div
                      key={product.id}
                      ref={isLast ? lastProductRef : null}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (index % 4) * 0.05 }}
                      whileHover={{ y: -5 }}
                      className="group bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/50"
                    >
                      <Link href={`/${locale}/product/${product.id}`}>
                        <div className="relative h-48 sm:h-56 md:h-64 overflow-hidden bg-secondary/20">
                          {product.image ? (
                            <Image
                              src={product.image}
                              alt={product.name}
                              fill
                              className="object-cover group-hover:scale-105 transition-transform duration-500"
                              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl bg-secondary/30">
                              💄
                            </div>
                          )}
                          {discount > 0 && (
                            <div className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                              {discount}% OFF
                            </div>
                          )}
                          <button
                            className="absolute top-2 right-2 p-2 bg-white/80 rounded-full hover:bg-white transition-colors opacity-0 group-hover:opacity-100 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              // Toggle wishlist placeholder
                            }}
                          >
                            <Heart size={18} className="text-gray-600 hover:text-red-500" />
                          </button>
                        </div>
                        <div className="p-3 md:p-4">
                          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
                          <h3 className="font-medium text-sm md:text-base line-clamp-1 text-foreground">{product.name}</h3>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="font-bold text-primary text-sm md:text-base">${Number(product.price).toFixed(2)}</span>
                            {discount > 0 && (
                              <span className="text-xs text-muted-foreground line-through">${Number(displayMrp).toFixed(2)}</span>
                            )}
                          </div>
                          <button
                            className="mt-2 w-full py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition text-xs md:text-sm font-medium flex items-center justify-center gap-1 cursor-pointer"
                            onClick={(e) => {
                              e.preventDefault();
                              // Add to cart placeholder
                            }}
                          >
                            <ShoppingCart size={14} />
                            Add to Cart
                          </button>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </div>

              {loading && products.length > 0 && (
                <div className="text-center py-8 text-muted-foreground">Loading more products...</div>
              )}

              {!hasMore && products.length > 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  — No more products —
                </div>
              )}
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
