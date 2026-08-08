'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const categories = [
  { name: 'Makeup', icon: '💄', description: 'Lipsticks, foundations, mascara & more' },
  { name: 'Skincare', icon: '🧴', description: 'Serums, moisturizers, sunscreens' },
  { name: 'Haircare', icon: '💇', description: 'Shampoos, conditioners, styling products' },
  { name: 'Fragrance', icon: '🌸', description: 'Perfumes, body mists, deodorants' },
  { name: 'Tools & Brushes', icon: '🖌️', description: 'Makeup brushes, sponges, applicators' },
  { name: 'Bath & Body', icon: '🛁', description: 'Shower gels, body lotions, scrubs' },
  { name: 'Men\'s Grooming', icon: '🪒', description: 'Beard oils, shaving creams, aftershaves' },
  { name: 'Natural & Organic', icon: '🌿', description: 'Eco-friendly, vegan, cruelty-free products' },
  { name: 'Luxury Collection', icon: '💎', description: 'Premium, high-end beauty products' },
  { name: 'Accessories', icon: '🎀', description: 'Hair accessories, jewelry, bags' },
];

export default function CategoriesPage() {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-playfair font-bold text-center mb-4">Shop by Category</h1>
          <p className="text-muted-foreground text-center mb-12 max-w-lg mx-auto">
            Discover our curated collections of premium beauty and grooming items tailored for your lifestyle.
          </p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/${locale}/products?category=${encodeURIComponent(cat.name)}`}>
                <div className="p-8 bg-card rounded-2xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all group flex flex-col justify-between h-full">
                  <div>
                    <div className="text-5xl mb-4 transform group-hover:scale-110 transition-transform duration-300 w-fit">{cat.icon}</div>
                    <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{cat.name}</h3>
                    <p className="text-muted-foreground text-sm mt-2">{cat.description}</p>
                  </div>
                  <p className="text-primary text-sm mt-6 font-medium flex items-center gap-1 group-hover:gap-2 transition-all">
                    Shop Collection <span>→</span>
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
