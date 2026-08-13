'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { Sparkles, ShoppingBag, ArrowRight } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

const Product3D = dynamic(
  () => import('@/components/3d/Product3D').then(mod => mod.Product3D),
  { 
    ssr: false,
    loading: () => <div className="w-full h-[450px] flex items-center justify-center bg-secondary/20 rounded-3xl animate-pulse">
      <p className="text-muted-foreground text-xs">✨ Loading 3D Viewport...</p>
    </div>
  }
);

export function Hero() {
  const t = useTranslations('common');
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden bg-black">
      {/* Background Cinematic Image - Full-Bleed Parallax */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-40 scale-105 transition-transform duration-[10000ms] ease-out"
        style={{ 
          backgroundImage: "url('https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=1600&q=80')" 
        }}
      />
      
      {/* Premium Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent z-10" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10" />

      <div className="container mx-auto px-4 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          
          {/* Left Content - Glassmorphic Box */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, ease: 'easeOut' }}
            className="lg:col-span-7 space-y-8 p-6 md:p-10 rounded-[32px] border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/20 border border-primary/30 rounded-full text-primary text-xs font-bold tracking-wider uppercase"
            >
              <Sparkles size={14} className="animate-pulse text-primary" />
              Beauty Parlé Premium
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-4xl md:text-6xl lg:text-7xl font-playfair font-bold leading-tight text-white"
            >
              {t('tagline')}
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-sm md:text-base text-gray-300 max-w-lg leading-relaxed"
            >
              {t('description')}
            </motion.p>

            {/* Micro-interaction Buttons */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link href={`/${locale}/products`}>
                <button className="px-8 py-4 bg-primary text-white rounded-full transition-all duration-300 hover:scale-105 hover:shadow-lg hover:shadow-primary/45 flex items-center gap-2.5 font-bold text-xs cursor-pointer shadow-md select-none border border-primary/20">
                  {t('shop_now')}
                  <ShoppingBag size={15} />
                </button>
              </Link>
              <Link href={`/${locale}/booking`}>
                <button className="px-8 py-4 bg-white/10 text-white rounded-full transition-all duration-300 hover:bg-white/20 hover:scale-105 flex items-center gap-2 font-bold text-xs border border-white/25 shadow-sm cursor-pointer select-none">
                  {t('book_appointment')}
                  <ArrowRight size={15} />
                </button>
              </Link>
            </motion.div>

            {/* Social Proof */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-4 pt-4 border-t border-white/10"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div 
                    key={i} 
                    className="w-9 h-9 rounded-full bg-cover border-2 border-black flex items-center justify-center text-xs font-bold shadow-inner"
                    style={{ backgroundImage: `url('https://images.unsplash.com/photo-${1500000000000 + i * 100000}?w=100&q=80')` }}
                  />
                ))}
                <div className="w-9 h-9 rounded-full bg-primary/30 border-2 border-black flex items-center justify-center text-[10px] font-bold text-primary">
                  +5K
                </div>
              </div>
              <div>
                <p className="text-xs font-bold text-white">5,000+ Happy Customers</p>
                <p className="text-[10px] text-gray-400">Premium quality products & services</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - 3D Product Viewport */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="lg:col-span-5 relative hidden lg:block"
          >
            <Product3D />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
