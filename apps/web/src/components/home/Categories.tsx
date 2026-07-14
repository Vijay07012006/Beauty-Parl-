'use client';

import { motion } from 'framer-motion';
import Link from 'next/link';
import { useParams } from 'next/navigation';

const categories = [
  { name: 'Makeup', icon: '💄', color: 'from-pink-400 to-rose-400' },
  { name: 'Skincare', icon: '🧴', color: 'from-green-400 to-emerald-400' },
  { name: 'Haircare', icon: '💇', color: 'from-purple-400 to-indigo-400' },
  { name: 'Fragrance', icon: '🌸', color: 'from-yellow-400 to-orange-400' },
];

export function Categories() {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <section className="py-16 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h2 className="text-4xl font-playfair font-bold">Shop by Category</h2>
          <p className="text-muted-foreground mt-2">Find exactly what you need</p>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {categories.map((cat, index) => (
            <motion.div
              key={cat.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.5 }}
              whileHover={{ scale: 1.05, y: -5 }}
              className="group"
            >
              <Link href={`/${locale}/products?category=${cat.name.toLowerCase()}`}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br p-8 text-center shadow-lg hover:shadow-xl transition-all duration-300">
                  <div className={`absolute inset-0 bg-gradient-to-br ${cat.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
                  <div className="relative z-10">
                    <div className="text-5xl mb-3">{cat.icon}</div>
                    <h3 className="font-semibold text-lg">{cat.name}</h3>
                    <p className="text-sm text-muted-foreground mt-1">Shop Now →</p>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
