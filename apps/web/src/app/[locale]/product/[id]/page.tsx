'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { motion } from 'framer-motion';
import { useCartStore } from '@/store/cartStore';

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
  category: string;
  stock: number;
}

export default function ProductDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCartStore();

  useEffect(() => {
    if (id) {
      api.get(`/products/${id}`)
        .then(res => setProduct(res.data))
        .catch(() => setProduct(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse text-lg font-medium text-primary">Loading...</div>
        </main>
        <Footer />
      </>
    );
  }

  if (!product) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <p className="text-muted-foreground">Product not found</p>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-12"
          >
            {/* Image */}
            <div className="relative h-[400px] md:h-[500px] bg-secondary/20 rounded-2xl overflow-hidden">
              {product.image ? (
                <Image src={product.image} alt={product.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">💄</div>
              )}
            </div>

            {/* Details */}
            <div className="space-y-6">
              <h1 className="text-4xl font-playfair font-bold">{product.name}</h1>
              <p className="text-sm text-muted-foreground">Category: {product.category}</p>
              <p className="text-3xl font-bold text-primary">${Number(product.price).toFixed(2)}</p>
              <p className="text-muted-foreground">{product.description}</p>
              <p className={`text-sm ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
                {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
              </p>
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 rounded-full border border-input hover:bg-secondary transition-colors"
                  >-</button>
                  <span className="w-12 text-center">{quantity}</span>
                  <button 
                    onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                    className="w-10 h-10 rounded-full border border-input hover:bg-secondary transition-colors"
                  >+</button>
                </div>
                 <button
                   onClick={() => {
                     addItem({
                       id: product.id,
                       name: product.name,
                       price: Number(product.price),
                       image: product.image,
                       maxStock: product.stock,
                       quantity: quantity,
                     });
                   }}
                   className="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition-colors font-medium cursor-pointer"
                 >
                   Add to Cart
                 </button>
              </div>
            </div>
          </motion.div>
        </div>
      </main>
      <Footer />
    </>
  );
}
