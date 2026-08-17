'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Calendar, User, Clock, ArrowLeft, Send, MessageSquare, Share2 } from 'lucide-react';
import Link from 'next/link';

interface Comment {
  id: number;
  comment: string;
  createdAt: string;
  user?: {
    name: string;
  };
}

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
  comments: Comment[];
}

export default function BlogDetailPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const slug = params?.slug as string;

  const { user } = useAuthStore();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submittingComment, setSubmittingComment] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [slug]);

  const fetchPost = async () => {
    try {
      const res = await api.get(`/blog/${slug}`);
      setPost(res.data);
    } catch (err) {
      console.error('Failed to load post:', err);
      toast.error('Article not found');
      router.push(`/${locale}/blog`);
    } finally {
      setLoading(false);
    }
  };

  const handlePostComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to post a comment');
      return;
    }
    if (!newComment.trim()) return;

    setSubmittingComment(true);
    try {
      await api.post(`/blog/${post?.id}/comment`, { comment: newComment });
      toast.success('Comment posted successfully!');
      setNewComment('');
      fetchPost(); // Reload comments
    } catch {
      toast.error('Failed to submit comment');
    } finally {
      setSubmittingComment(false);
    }
  };

  const calculateReadTime = (content: string): number => {
    const wordsPerMinute = 200;
    const words = content.split(/\s+/).length;
    return Math.max(1, Math.ceil(words / wordsPerMinute));
  };

  const getShareLink = () => {
    if (typeof window === 'undefined') return '';
    return window.location.href;
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <span className="text-sm font-semibold text-primary">Loading article details...</span>
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!post) return null;

  const imageSrc = post.imageUrl || 'https://placehold.co/1200x600/e2e8f0/64748b?text=Beauty+Tutorial';

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          {/* Back button */}
          <Link
            href={`/${locale}/blog`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition group"
          >
            <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition" /> Back to Blog
          </Link>

          {/* Article Header */}
          <div className="space-y-4">
            <div className="flex items-center gap-3 text-[10px] text-muted-foreground font-mono">
              <span className="flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              <span>•</span>
              <span>{calculateReadTime(post.content)} min read</span>
              {post.category && (
                <>
                  <span>•</span>
                  <span className="text-primary font-bold uppercase">{post.category}</span>
                </>
              )}
            </div>

            <h1 className="text-3xl md:text-5xl font-playfair font-bold text-foreground leading-tight">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-sm text-muted-foreground italic leading-relaxed border-l-2 border-primary/45 pl-4">
                {post.excerpt}
              </p>
            )}
          </div>

          {/* Featured Image */}
          <div className="aspect-video w-full overflow-hidden rounded-3xl bg-muted border border-border/40 shadow-sm">
            <img src={imageSrc} alt={post.title} className="w-full h-full object-cover" />
          </div>

          {/* Content & Sharing */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Sidebar Share */}
            <div className="lg:col-span-1 space-y-4">
              <div className="bg-card border border-border/40 p-5 rounded-3xl space-y-4 text-center lg:text-left sticky top-24">
                <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1 justify-center lg:justify-start">
                  <Share2 className="w-3.5 h-3.5" /> Share Article
                </h4>
                <div className="flex lg:flex-col gap-2 justify-center">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(getShareLink());
                      toast.success('Article link copied!');
                    }}
                    className="flex-1 py-2 bg-secondary/50 hover:bg-secondary text-foreground text-[10px] font-bold rounded-xl transition cursor-pointer"
                  >
                    Copy Link
                  </button>
                  <a
                    href={`https://api.whatsapp.com/send?text=${encodeURIComponent(post.title + ' ' + getShareLink())}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white text-center text-[10px] font-bold rounded-xl transition"
                  >
                    WhatsApp
                  </a>
                </div>
              </div>
            </div>

            {/* Article Content Body */}
            <div className="lg:col-span-3 space-y-12">
              <div className="prose prose-pink max-w-none text-sm text-foreground/80 leading-relaxed space-y-6">
                {post.content.split('\n').map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="flex gap-2 items-center flex-wrap pt-4 border-t border-border/10">
                  <span className="text-[10px] text-muted-foreground font-semibold">Tags:</span>
                  {post.tags.map((tag) => (
                    <span key={tag} className="bg-secondary/40 text-muted-foreground px-2.5 py-1 rounded-lg text-[9px] font-bold">
                      #{tag}
                    </span>
                  ))}
                </div>
              )}

              {/* Comments Section */}
              <div className="space-y-6 pt-6 border-t border-border/20">
                <h3 className="text-lg font-playfair font-bold text-foreground flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-primary" /> Comments ({post.comments?.length || 0})
                </h3>

                {/* Comment Form */}
                {user ? (
                  <form onSubmit={handlePostComment} className="space-y-3 bg-card border border-border/40 p-4 rounded-3xl">
                    <span className="text-[10px] font-bold text-muted-foreground">Post a comment as {user.name}</span>
                    <textarea
                      placeholder="Share your feedback or questions..."
                      value={newComment}
                      onChange={(e) => setNewComment(e.target.value)}
                      rows={3}
                      className="w-full bg-secondary/10 border border-border/40 rounded-2xl p-3 text-xs focus:outline-none focus:border-primary/50 text-foreground"
                    />
                    <div className="flex justify-end">
                      <button
                        type="submit"
                        disabled={submittingComment || !newComment.trim()}
                        className="py-2 px-5 bg-primary text-white rounded-xl font-bold text-xs hover:bg-primary/95 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <Send className="w-3.5 h-3.5" /> {submittingComment ? 'Posting...' : 'Post Comment'}
                      </button>
                    </div>
                  </form>
                ) : (
                  <div className="p-5 text-center bg-secondary/10 rounded-3xl border border-border/30 text-xs">
                    Please <Link href={`/${locale}/auth/login`} className="text-primary font-bold hover:underline">Sign In</Link> to share comments.
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
                  {!post.comments || post.comments.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6">Be the first to share comments on this article!</p>
                  ) : (
                    post.comments.map((comment) => (
                      <div key={comment.id} className="bg-secondary/10 border border-border/20 p-4 rounded-2xl space-y-2">
                        <div className="flex justify-between items-center text-[10px] text-muted-foreground">
                          <span className="font-bold text-foreground">{comment.user?.name || 'Anonymous User'}</span>
                          <span>{new Date(comment.createdAt).toLocaleDateString()}</span>
                        </div>
                        <p className="text-xs text-foreground/80 leading-relaxed">{comment.comment}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
