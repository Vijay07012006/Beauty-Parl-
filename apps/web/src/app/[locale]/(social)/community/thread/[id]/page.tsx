'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuthStore } from '@/store/authStore';
import { MessageSquare, Send, ShieldAlert, ShieldCheck, Calendar } from 'lucide-react';
import { toast } from 'sonner';

interface Reply {
  id: number;
  content: string;
  isHidden: boolean;
  isModerated: boolean;
  createdAt: string;
  user?: {
    name: string;
  };
}

interface Thread {
  id: number;
  title: string;
  content: string;
  createdAt: string;
  user?: {
    name: string;
  };
  replies?: Reply[];
}

export default function ThreadDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [thread, setThread] = useState<Thread | null>(null);
  const [replyText, setReplyText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchThread = async () => {
    try {
      const res = await api.get(`/forums/thread/${id}`);
      setThread(res.data);
    } catch {
      toast.error('Failed to load thread details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchThread();
  }, [id]);

  const handlePostReply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!replyText.trim()) return;

    if (!user) {
      toast.error('Please sign in to write replies');
      router.push(`/${locale}/auth/login`);
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/forums/thread/${id}/reply`, { content: replyText });
      setReplyText('');
      toast.success('Reply posted successfully!');
      fetchThread();
    } catch {
      toast.error('Failed to submit reply');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground py-20">
          Loading discussion thread...
        </div>
        <Footer />
      </div>
    );
  }

  if (!thread) {
    return (
      <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-muted-foreground py-20">
          Thread not found
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-4xl space-y-8">
        <div className="bg-card border border-border/40 p-8 rounded-3xl shadow-sm space-y-4">
          <h1 className="text-2xl font-bold text-primary font-playfair">{thread.title}</h1>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>By {thread.user?.name || 'Anonymous'}</span>
            <span className="flex items-center gap-1">
              <Calendar size={12} /> {new Date(thread.createdAt).toLocaleString()}
            </span>
          </div>
          <div className="text-sm border-t border-border/40 pt-4 leading-relaxed whitespace-pre-wrap">
            {thread.content}
          </div>
        </div>

        <div className="space-y-6">
          <h3 className="text-lg font-bold font-playfair flex items-center gap-2 border-b border-border/40 pb-3">
            <MessageSquare size={18} /> Replies ({thread.replies?.length || 0})
          </h3>

          <div className="space-y-4">
            {thread.replies?.length === 0 ? (
              <p className="text-xs text-muted-foreground italic py-4">No replies posted yet.</p>
            ) : (
              thread.replies?.map((reply) => (
                <div
                  key={reply.id}
                  className={`border rounded-3xl p-5 shadow-sm transition-all ${reply.isHidden ? 'bg-rose-50/10 border-rose-200/20' : 'bg-card border-border/40'}`}
                >
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground">
                      <span>{reply.user?.name || 'Anonymous'}</span>
                      <span className="text-[10px] font-normal">•</span>
                      <span className="text-[10px] font-normal font-mono">
                        {new Date(reply.createdAt).toLocaleTimeString()}
                      </span>
                    </div>

                    {reply.isModerated && (
                      <span
                        className={`text-[9px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${reply.isHidden ? 'bg-rose-500/10 text-rose-500 border border-rose-500/20' : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'}`}
                      >
                        {reply.isHidden ? (
                          <>
                            <ShieldAlert size={10} /> Flagged
                          </>
                        ) : (
                          <>
                            <ShieldCheck size={10} /> AI Checked
                          </>
                        )}
                      </span>
                    )}
                  </div>

                  <div className="mt-3 text-sm leading-relaxed whitespace-pre-wrap">
                    {reply.isHidden ? (
                      <span className="text-xs text-muted-foreground italic blur-[1px] select-none">
                        This comment was flagged and hidden due to toxicity, abuse or harassment.
                      </span>
                    ) : (
                      reply.content
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        <form
          onSubmit={handlePostReply}
          className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm space-y-4"
        >
          <h4 className="text-sm font-bold font-playfair">Write a Reply</h4>
          <textarea
            value={replyText}
            onChange={(e) => setReplyText(e.target.value)}
            placeholder="Type your reply. AI will automatically moderate messages for hate speech or toxicity."
            rows={4}
            className="w-full text-xs p-4 bg-secondary/20 border border-border/40 rounded-2xl focus:outline-none focus:border-primary/50 resize-none"
          />
          <button
            type="submit"
            disabled={submitting || !replyText.trim()}
            className="px-6 py-2.5 bg-primary hover:bg-primary/90 text-white text-xs font-semibold rounded-full flex items-center gap-1.5 shadow disabled:opacity-50 disabled:cursor-not-allowed transition-all cursor-pointer"
          >
            Post Reply
          </button>
        </form>
      </main>

      <Footer />
    </div>
  );
}
