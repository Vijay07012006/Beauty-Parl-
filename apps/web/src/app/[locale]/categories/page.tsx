'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

const categories = [
  { name: 'Makeup', icon: '💄', description: 'Lipsticks, Foundations, Mascara & more' },
  { name: 'Skincare', icon: '🧴', description: 'Serums, Moisturizers, Sunscreen' },
  { name: 'Haircare', icon: '💇', description: 'Shampoo, Conditioners, Styling products' },
  { name: 'Fragrance', icon: '🌸', description: 'Perfumes, Body Mists, Deodorants' },
];

export default function CategoriesPage() {
  const params = useParams();
  const locale = params?.locale || 'en';

  return (
    <>
      <Header />
      <main className="min-h-screen py-12">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl font-playfair font-bold text-center mb-4">Shop by Category</h1>
          <p className="text-muted-foreground text-center mb-12">Find exactly what you need</p>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {categories.map((cat) => (
              <Link key={cat.name} href={`/${locale}/products?category=${cat.name.toLowerCase()}`}>
                <div className="p-8 bg-card rounded-2xl border border-border/50 hover:border-primary/50 hover:shadow-lg transition-all group">
                  <div className="text-5xl mb-4">{cat.icon}</div>
                  <h3 className="text-2xl font-bold group-hover:text-primary transition-colors">{cat.name}</h3>
                  <p className="text-muted-foreground text-sm mt-2">{cat.description}</p>
                  <p className="text-primary text-sm mt-4 font-medium">Shop Now →</p>
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
