'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Category {
  id: number;
  name: string;
  slug: string;
  description: string;
  image: string;
  count: number;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/categories')
      .then(res => {
        setCategories(res.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[...Array(8)].map((_, i) => (
                <div key={i} className="animate-pulse bg-card rounded-2xl h-48" />
              ))}
            </div>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  const categoryEmojis = ['💄', '🧴', '💇', '🌸', '🖌️', '🛁', '🧔', '🌿', '💎', '🎀'];

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-background">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-playfair font-bold text-center mb-4 text-foreground">Shop by Category</h1>
          <p className="text-muted-foreground text-center mb-12">Find exactly what you need</p>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {categories.map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -5 }}
              >
                <Link href={`/en/products?category=${category.slug}`}>
                  <div className="relative bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 border border-border/50 group h-48 cursor-pointer">
                    {category.image ? (
                      <div className="relative w-full h-full">
                        <Image
                          src={category.image}
                          alt={category.name}
                          fill
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl bg-secondary/30">
                        {categoryEmojis[index % categoryEmojis.length]}
                      </div>
                    )}
                    <div className="absolute bottom-4 left-4 right-4 z-10">
                      <h3 className="text-white font-bold text-lg">{category.name}</h3>
                      <p className="text-white/70 text-sm">{category.count || 0} products</p>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
