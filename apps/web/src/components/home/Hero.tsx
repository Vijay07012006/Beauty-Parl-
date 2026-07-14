'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { ArrowRight, Sparkles, ShoppingBag } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';

const Product3D = dynamic(
  () => import('@/components/3d/Product3D').then(mod => mod.Product3D),
  { 
    ssr: false,
    loading: () => <div className="w-full h-[500px] flex items-center justify-center bg-secondary/20 rounded-2xl animate-pulse">
      <p className="text-muted-foreground">✨ Loading 3D...</p>
    </div>
  }
);

export function Hero() {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <section className="relative min-h-[90vh] flex items-center overflow-hidden">
      {/* Background Image with Overlay */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat opacity-10 blur-sm"
        style={{ backgroundImage: "url('/images/salon_hero.png')" }}
      />
      <div className="absolute inset-0 bg-gradient-to-br from-secondary/50 via-background/80 to-primary/10" />

      <div className="container mx-auto px-4 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium"
            >
              <Sparkles size={16} className="animate-pulse" />
              Premium Beauty Products
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="text-5xl md:text-7xl font-playfair font-bold leading-tight"
            >
              Where Beauty Speaks{' '}
              <span className="text-primary">Your Language</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="text-lg text-muted-foreground max-w-lg"
            >
              Discover premium cosmetics, book professional makeup services,
              and embrace beauty that understands you — in your language.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="flex flex-wrap gap-4"
            >
              <Link href={`/${locale}/products`}>
                <button className="px-8 py-4 bg-primary text-white rounded-full hover:bg-primary/90 transition-all hover:scale-105 flex items-center gap-2 font-medium shadow-lg shadow-primary/30">
                  Shop Now
                  <ShoppingBag size={18} />
                </button>
              </Link>
              <Link href={`/${locale}/booking`}>
                <button className="px-8 py-4 bg-accent/10 text-accent-foreground rounded-full hover:bg-accent/20 transition-all hover:scale-105 font-medium border border-accent/30">
                  Book Appointment
                </button>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="flex items-center gap-6 pt-4"
            >
              <div className="flex -space-x-2">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="w-10 h-10 rounded-full bg-primary/20 border-2 border-background flex items-center justify-center text-sm font-bold text-primary">
                    👤
                  </div>
                ))}
                <div className="w-10 h-10 rounded-full bg-accent/20 border-2 border-background flex items-center justify-center text-sm font-bold text-accent">
                  +5K
                </div>
              </div>
              <div>
                <p className="text-sm font-semibold">5,000+ Happy Customers</p>
                <p className="text-xs text-muted-foreground">Trusted by beauty lovers</p>
              </div>
            </motion.div>
          </motion.div>

          {/* Right - 3D Product */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.4, duration: 0.8, type: "spring" }}
            className="relative"
          >
            <Product3D />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
