'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface Category {
  id: number;
  name: string;
}

export default function NewThreadPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [categories, setCategories] = useState<Category[]>([]);
  const [categoryId, setCategoryId] = useState('');
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to create new forum threads');
      router.push(`/${locale}/auth/login`);
      return;
    }

    async function loadCategories() {
      try {
        const res = await api.get('/forums/categories');
        const cats = Array.isArray(res.data) ? res.data : [];
        setCategories(cats);
        if (cats.length > 0) {
          setCategoryId(cats[0].id.toString());
        }
      } catch {
        toast.error('Failed to load forum categories');
      } finally {
        setLoading(false);
      }
    }
    loadCategories();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !categoryId) {
      toast.error('Please fill in all fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/forums/thread', {
        categoryId: Number(categoryId),
        title,
        content,
      });
      toast.success('Thread created successfully!');
      router.push(`/${locale}/community/thread/${res.data.id}`);
    } catch {
      toast.error('Failed to create thread');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground py-20">
          Loading forum editor...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-2xl space-y-6">
        <div className="flex items-center gap-3">
          <Link
            href={`/${locale}/community`}
            className="p-2 bg-secondary rounded-full hover:bg-secondary/80 transition-colors text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-2xl font-bold font-playfair">Create New Discussion</h1>
            <p className="text-xs text-muted-foreground">Share your question with the community.</p>
          </div>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-6"
        >
          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Category
            </label>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              className="w-full text-xs p-3 bg-secondary/20 border border-border/40 rounded-2xl focus:outline-none focus:border-primary/50 cursor-pointer"
            >
              {(Array.isArray(categories) ? categories : []).map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Topic Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Keep it descriptive and precise..."
              className="w-full text-xs p-3.5 bg-secondary/20 border border-border/40 rounded-2xl focus:outline-none focus:border-primary/50"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-semibold text-muted-foreground block">
              Detailed Description
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Elaborate on your question or routine details here. Keep posts respectful."
              rows={8}
              className="w-full text-xs p-4 bg-secondary/20 border border-border/40 rounded-2xl focus:outline-none focus:border-primary/50 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting || !title.trim() || !content.trim()}
            className="px-6 py-3 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Publish Thread
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
