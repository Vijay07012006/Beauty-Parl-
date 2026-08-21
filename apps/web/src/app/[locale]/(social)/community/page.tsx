'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Calendar, User, ArrowRight, MessageCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Category {
  id: number;
  name: string;
  description: string;
}

interface Thread {
  id: number;
  title: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

export default function ForumCategoriesPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryThreads, setCategoryThreads] = useState<{ [catId: number]: Thread[] }>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const catRes = await api.get('/forums/categories');
        const cats = Array.isArray(catRes.data) ? (catRes.data as Category[]) : [];
        setCategories(cats);

        const threadPromises = cats.map(async (cat) => {
          const res = await api.get(`/forums/category/${cat.id}/threads`);
          return { catId: cat.id, threads: (Array.isArray(res.data) ? res.data : []).slice(0, 3) as Thread[] };
        });

        const results = await Promise.all(threadPromises);
        const threadsMap: { [catId: number]: Thread[] } = {};
        for (const res of results) {
          threadsMap[res.catId] = res.threads;
        }
        setCategoryThreads(threadsMap);
      } catch {
        toast.error('Failed to load forum categories');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-gradient-to-r from-primary/10 via-accent/5 to-secondary/15 p-8 rounded-3xl border border-border/40">
          <div>
            <h1 className="text-3xl font-bold font-playfair flex items-center gap-3">
              🗣️ Community Forums
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Ask questions, share recommendations, and exchange skincare routines.
            </p>
          </div>
          <Link
            href={`/${locale}/community/new`}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-full shadow transition-all hover:scale-105"
          >
            Create New Thread
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-muted-foreground animate-pulse text-xs">
            Loading forums...
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {(Array.isArray(categories) ? categories : []).map((category) => {
              const threads = categoryThreads[category.id] || [];
              return (
                <div
                  key={category.id}
                  className="bg-card border border-border/40 hover:border-primary/20 transition-all rounded-3xl p-6 shadow-sm hover:shadow-md flex flex-col justify-between"
                >
                  <div>
                    <h3 className="text-lg font-bold text-primary font-playfair border-b border-border/40 pb-3 mb-4">
                      {category.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-6">
                      {category.description}
                    </p>

                    <div className="space-y-3">
                      {threads.length === 0 ? (
                        <p className="text-[10px] text-muted-foreground/60 italic py-2">
                          No threads posted yet. Be the first!
                        </p>
                      ) : (
                        (Array.isArray(threads) ? threads : []).map((thread) => (
                          <Link
                            key={thread.id}
                            href={`/${locale}/community/thread/${thread.id}`}
                            className="flex items-start gap-3 p-3 bg-secondary/10 hover:bg-secondary/20 rounded-2xl border border-border/10 transition-colors group"
                          >
                            <MessageCircle size={14} className="text-primary/70 mt-0.5 shrink-0" />
                            <div className="flex-grow">
                              <h4 className="text-xs font-semibold group-hover:text-primary transition-colors line-clamp-1">
                                {thread.title}
                              </h4>
                              <div className="flex items-center gap-2 mt-1 text-[9px] text-muted-foreground">
                                <span className="flex items-center gap-0.5">
                                  <User size={8} /> {thread.user?.name || 'Anonymous'}
                                </span>
                                <span>•</span>
                                <span className="flex items-center gap-0.5">
                                  <Calendar size={8} /> {new Date(thread.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </Link>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
