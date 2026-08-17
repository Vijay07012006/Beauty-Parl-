'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { BookOpen, Search, Calendar, User, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface BlogPost {
  id: number;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  imageUrl?: string;
  category?: string;
  tags?: string[];
  createdAt: string;
  viewCount: number;
}

export default function BlogListingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      const url = selectedCategory ? `/blog?category=${encodeURIComponent(selectedCategory)}` : '/blog';
      const res = await api.get(url);
      setPosts(res.data);
    } catch (err) {
      console.error('Failed to load blog posts:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const filteredPosts = posts.filter(post => 
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (post.excerpt && post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const categories = ['Skincare', 'Makeup', 'Haircare', 'Tutorials', 'Lifestyle'];

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading beauty articles...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-6xl space-y-10">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 border border-primary/25 rounded-full text-xs font-bold text-primary">
              <BookOpen className="w-3.5 h-3.5" /> Parlé Blog
            </div>
            <h1 className="text-4xl md:text-5xl font-playfair font-bold text-foreground">
              Beauty Tips & Expert Tutorials
            </h1>
            <p className="text-sm text-muted-foreground max-w-xl mx-auto">
              Your daily guide to premium skincare, cosmetic tutorials, wellness tips, and haircare recommendations.
            </p>
          </div>

          {/* Filters & Search */}
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between bg-card border border-border/40 p-4 rounded-3xl shadow-sm">
            {/* Category Tags */}
            <div className="flex gap-2 items-center flex-wrap overflow-x-auto">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                  selectedCategory === null
                    ? 'bg-primary text-white'
                    : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60'
                }`}
              >
                All Categories
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer transition ${
                    selectedCategory === cat
                      ? 'bg-primary text-white'
                      : 'bg-secondary/40 text-muted-foreground hover:bg-secondary/60'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Search Input */}
            <div className="relative w-full md:w-64">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-secondary/20 border border-border/40 rounded-full pl-9 pr-4 py-2 text-xs focus:outline-none focus:border-primary/50 text-foreground"
              />
            </div>
          </div>

          {/* Posts Grid */}
          {filteredPosts.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border/40 rounded-3xl">
              <p className="text-sm text-muted-foreground">No beauty articles match your search.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {filteredPosts.map((post) => {
                const readTime = calculateReadTime(post.content);
                const imageSrc = post.imageUrl || 'https://placehold.co/600x400/e2e8f0/64748b?text=Beauty+Tutorial';

                return (
                  <article key={post.id} className="bg-card border border-border/50 rounded-3xl overflow-hidden shadow-sm flex flex-col justify-between hover:shadow-md transition">
                    <Link href={`/${locale}/blog/${post.slug}`}>
                      <div className="aspect-video relative overflow-hidden bg-muted">
                        <img
                          src={imageSrc}
                          alt={post.title}
                          className="w-full h-full object-cover hover:scale-105 transition duration-500"
                        />
                        {post.category && (
                          <span className="absolute top-3 left-3 bg-neutral-900/80 backdrop-blur-sm text-white font-bold text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-lg">
                            {post.category}
                          </span>
                        )}
                      </div>
                    </Link>

                    <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3.5 h-3.5" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          <span>•</span>
                          <span>{readTime} min read</span>
                        </div>

                        <Link href={`/${locale}/blog/${post.slug}`}>
                          <h3 className="font-playfair font-bold text-base text-foreground hover:text-primary transition line-clamp-2">
                            {post.title}
                          </h3>
                        </Link>

                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3">
                          {post.excerpt || 'Read our latest insights and tutorials written by top beauty professionals.'}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-border/10 flex justify-between items-center">
                        <Link
                          href={`/${locale}/blog/${post.slug}`}
                          className="text-xs font-bold text-primary hover:text-primary/80 transition flex items-center gap-1 group"
                        >
                          Read More <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition" />
                        </Link>

                        <span className="text-[10px] text-muted-foreground">{post.viewCount} views</span>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
