'use client';

import { useEffect } from 'react';
import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';
import { useProductStore } from '@/store/productStore';
import { useCartStore } from '@/store/cartStore';

export function FeaturedProducts() {
  const { products, loading, error, fetchProducts } = useProductStore();
  const { addItem } = useCartStore();

  useEffect(() => {
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-muted-foreground">Loading products...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-500">{error}</p>
        </div>
      </section>
    );
  }

  const displayProducts = products.slice(0, 4);

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-playfair font-bold">Featured Products</h2>
          <p className="text-muted-foreground mt-2">Our handpicked favorites</p>
        </motion.div>

        {displayProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No products available yet. Add some via API!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {displayProducts.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.5 }}
                whileHover={{ y: -8 }}
                className="group"
              >
                <Link href={`/product/${product.id}`}>
                  <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-shadow duration-300">
                    <div className="relative h-64 overflow-hidden bg-secondary/30">
                      {product.image ? (
                        <Image
                          src={product.image}
                          alt={product.name}
                          fill
                          priority={index < 2}
                          sizes="(max-width: 768px) 100vw, 300px"
                          className="object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-4xl">
                          💄
                        </div>
                      )}
                    </div>
                    <div className="p-4 space-y-2">
                      <h3 className="font-medium text-lg truncate">{product.name}</h3>
                      <p className="text-primary font-bold">${Number(product.price).toFixed(2)}</p>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          addItem({
                            id: product.id,
                            name: product.name,
                            price: Number(product.price),
                            image: product.image,
                            maxStock: product.stock || 10,
                          });
                        }}
                        className="w-full mt-2 px-4 py-2 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors text-sm font-medium cursor-pointer"
                      >
                        Add to Cart
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
