'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Send, CheckCircle2, Clock, AlertCircle } from 'lucide-react';

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  aiSummary?: string;
  createdAt: string;
}

interface Reply {
  id: number;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

export default function TicketDetailPage() {
  const { id, locale } = useParams<{ id: string; locale: string }>();
  const router = useRouter();

  const [ticket, setTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTicketDetails = async () => {
    try {
      const res = await api.get(`/support/my-tickets/${id}`);
      setTicket(res.data.ticket);
      setReplies(res.data.replies || []);
    } catch {
      toast.error('Failed to load support ticket details');
      router.push(`/${locale}/profile/tickets`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTicketDetails();
  }, [id]);

  const handleSendReply = async () => {
    if (!replyText.trim() || !ticket) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/support/tickets/${ticket.id}/reply`, {
        message: replyText,
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyText('');
      toast.success('Reply sent!');
      
      // Fetch ticket again to update status
      const update = await api.get(`/support/my-tickets/${id}`);
      setTicket(update.data.ticket);
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold text-[10px] uppercase tracking-wider">Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[10px] uppercase tracking-wider">Active</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full font-bold text-[10px] uppercase tracking-wider">Resolved</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-500 rounded-full font-bold text-[10px] uppercase tracking-wider">Closed</span>;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  if (!ticket) return null;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Back Link */}
        <Link 
          href={`/${locale}/profile/tickets`} 
          className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-primary mb-6 transition-colors"
        >
          <ArrowLeft size={14} /> Back to My Tickets
        </Link>

        {/* Conversation Shell */}
        <div className="p-6 rounded-[32px] border border-border/40 bg-card/65 backdrop-blur-md shadow-xl space-y-6">
          
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-primary">Ticket #{ticket.id}</span>
                {getStatusBadge(ticket.status)}
              </div>
              <h1 className="text-base md:text-lg font-bold text-foreground">{ticket.subject}</h1>
            </div>
            <span className="text-[10px] text-muted-foreground font-medium sm:text-right">
              Opened {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
            </span>
          </div>

          {/* Original query details */}
          <div className="p-4 rounded-2xl bg-secondary/15 border border-border/20 space-y-1 text-xs">
            <span className="block text-[9px] uppercase font-bold text-muted-foreground">Original Request Message</span>
            <p className="leading-relaxed text-foreground whitespace-pre-line">{ticket.message}</p>
          </div>

          {/* Resolution Banner */}
          {ticket.status === 'resolved' && (
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-600">
                <CheckCircle2 size={15} /> This query has been resolved
              </div>
              {ticket.aiSummary && (
                <div className="text-xs text-foreground leading-relaxed pl-5 bg-card/40 p-3 rounded-xl border border-emerald-500/5">
                  <span className="block text-[9px] uppercase font-bold text-muted-foreground mb-1">Resolution Summary</span>
                  {ticket.aiSummary}
                </div>
              )}
            </div>
          )}

          {/* Replies Stream */}
          <div className="space-y-4">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest block">Conversation Thread</span>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
              {replies.map((reply) => (
                <div
                  key={reply.id}
                  className={`p-3.5 rounded-2xl text-xs max-w-[85%] space-y-1 ${
                    reply.isAdmin
                      ? 'bg-secondary/35 border border-border/30 mr-auto'
                      : 'bg-primary text-white ml-auto'
                  }`}
                >
                  <p className="leading-relaxed">{reply.message}</p>
                  <span className={`block text-[9px] text-right font-semibold ${!reply.isAdmin ? 'text-white/70' : 'text-muted-foreground'}`}>
                    {reply.isAdmin ? 'Beauty Parlé Support' : 'You'} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
              {replies.length === 0 && (
                <p className="text-center text-muted-foreground text-xs py-4">No active follow-ups yet.</p>
              )}
            </div>
          </div>

          {/* Reply composer */}
          {ticket.status !== 'resolved' && ticket.status !== 'closed' && (
            <div className="flex items-center gap-3 pt-2">
              <input
                type="text"
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                placeholder="Type your response..."
                className="flex-1 text-xs p-3.5 bg-secondary/15 rounded-full border border-border/50 focus:border-primary outline-none transition"
              />
              <button
                onClick={handleSendReply}
                disabled={actionLoading || !replyText.trim()}
                className="p-3.5 bg-primary hover:bg-primary/90 text-white rounded-full transition flex items-center justify-center shrink-0 cursor-pointer shadow-md"
              >
                <Send size={14} />
              </button>
            </div>
          )}

        </div>

      </div>
    </div>
  );
}
