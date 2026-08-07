'use client';

import { useEffect, useState, Suspense } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useSearchParams, useParams } from 'next/navigation';
import { api } from '@/lib/api';

function ProductsContent() {
  const searchParams = useSearchParams();
  const params = useParams();
  const locale = params?.locale || 'en';
  const urlCategory = searchParams?.get('category') || 'all';
  const [category, setCategory] = useState(urlCategory);

  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const limit = 8;

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/products?page=${page}&limit=${limit}`);
      if (response.data && Array.isArray(response.data)) {
        setProducts(response.data);
        setTotalPages(1);
      } else if (response.data && response.data.data) {
        setProducts(response.data.data);
        setTotalPages(Math.ceil(response.data.total / limit));
      }
    } catch (err) {
      console.error('Failed to fetch products', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, [page]);

  useEffect(() => {
    if (urlCategory) {
      setCategory(urlCategory);
      setPage(1); // Reset to page 1 when category changes
    }
  }, [urlCategory]);

  const filteredProducts = category.toLowerCase() === 'all'
    ? products 
    : products.filter(p => p.category?.toLowerCase() === category.toLowerCase());

  const categories = ['all', 'Makeup', 'Skincare', 'Haircare', 'Fragrance'];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-lg font-medium text-primary">Loading products...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen py-12">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-playfair font-bold mb-8">All Products</h1>
        
        {/* Category Filters */}
        <div className="flex flex-wrap gap-3 mb-8">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => {
                setCategory(cat);
                setPage(1);
              }}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors cursor-pointer ${
                category.toLowerCase() === cat.toLowerCase()
                  ? 'bg-primary text-white' 
                  : 'bg-secondary hover:bg-primary/20'
              }`}
            >
              {cat === 'all' ? 'All' : cat}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        {filteredProducts.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">No products found</div>
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {filteredProducts.map((product, index) => (
                <motion.div
                  key={product.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  whileHover={{ y: -5 }}
                  className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow"
                >
                  <Link href={`/${locale}/product/${product.id}`}>
                    <div className="relative h-56 bg-secondary/20">
                      {product.image ? (
                        <Image src={product.image} alt={product.name} fill className="object-cover" sizes="(max-width: 768px) 100vw, 25vw" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">💄</div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-medium truncate">{product.name}</h3>
                      <p className="text-sm text-muted-foreground truncate">{product.category}</p>
                      <p className="text-primary font-bold mt-1">${Number(product.price).toFixed(2)}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="flex justify-center items-center gap-4 mt-12">
                <button
                  onClick={() => setPage(p => Math.max(p - 1, 1))}
                  disabled={page === 1}
                  className="px-4 py-2 bg-secondary rounded-xl hover:bg-primary hover:text-white disabled:opacity-50 transition cursor-pointer font-medium"
                >
                  Previous
                </button>
                <span className="text-sm font-medium">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                  disabled={page === totalPages}
                  className="px-4 py-2 bg-secondary rounded-xl hover:bg-primary hover:text-white disabled:opacity-50 transition cursor-pointer font-medium"
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
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
          <div className="animate-pulse text-lg font-medium text-primary">Loading products...</div>
        </main>
      }>
        <ProductsContent />
      </Suspense>
      <Footer />
    </>
  );
}
