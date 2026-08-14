'use client';

import { motion, AnimatePresence } from 'framer-motion';
import Image from 'next/image';
import { X, ShoppingCart, Star } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { toast } from 'sonner';
import { RatingStars } from './RatingStars';
import { PriceDisplay } from './PriceDisplay';

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

interface QuickViewModalProps {
  product: Product;
  isOpen: boolean;
  onClose: () => void;
}

export function QuickViewModal({ product, isOpen, onClose }: QuickViewModalProps) {
  const { addItem } = useCartStore();

  const handleAddToCart = (e: React.MouseEvent) => {
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
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-[4px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', damping: 25, stiffness: 350 }}
            className="bg-card w-full max-w-3xl rounded-3xl overflow-hidden border border-border shadow-2xl relative z-10 flex flex-col md:flex-row max-h-[90vh] md:max-h-[500px]"
          >
            {/* Close Button */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 z-20 p-2 bg-background/85 hover:bg-background border rounded-full text-foreground hover:text-primary transition-all cursor-pointer shadow-sm"
              aria-label="Close modal"
            >
              <X size={18} />
            </button>

            {/* Product Image Section */}
            <div className="w-full md:w-1/2 bg-secondary/15 relative h-64 md:h-full">
              {product.image ? (
                <Image
                  src={product.image}
                  alt={product.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-6xl">💄</div>
              )}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-background/80 backdrop-blur-[2px] flex items-center justify-center">
                  <span className="px-3 py-1 text-xs font-bold text-red-600 bg-red-50 border border-red-200 rounded-full">
                    Out of Stock
                  </span>
                </div>
              )}
            </div>

            {/* Product Details Section */}
            <div className="w-full md:w-1/2 p-6 md:p-8 flex flex-col justify-between overflow-y-auto space-y-4">
              <div className="space-y-3">
                {product.brand && (
                  <span className="text-[10px] font-bold tracking-wider text-primary uppercase">
                    {product.brand}
                  </span>
                )}
                <h2 className="text-xl md:text-2xl font-playfair font-bold text-foreground leading-tight">
                  {product.name}
                </h2>

                {product.rating !== undefined && (
                  <div className="flex items-center gap-2">
                    <RatingStars rating={product.rating} count={product.ratingCount} size={14} />
                  </div>
                )}

                <div className="pt-1">
                  <PriceDisplay
                    price={product.price}
                    mrp={product.mrp}
                    discountPercent={product.discountPercent}
                    size="md"
                  />
                </div>

                <hr className="border-border/40" />

                <p className="text-xs text-muted-foreground line-clamp-4 leading-relaxed">
                  {product.description}
                </p>
              </div>

              <div className="pt-2">
                <button
                  onClick={handleAddToCart}
                  disabled={product.stock <= 0}
                  className="w-full py-3.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 transition-all shadow-md shadow-primary/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  <ShoppingCart size={14} /> Add to Cart
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
