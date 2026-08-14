'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { 
  ArrowLeft, 
  Send, 
  MessageSquare, 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  FileText,
  User,
  ExternalLink
} from 'lucide-react';

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

export default function SupportChatPage() {
  const { user } = useAuthStore();
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingTickets, setLoadingTickets] = useState(true);
  
  // Selected ticket states
  const ticketIdParam = searchParams?.get('ticketId');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [replyText, setReplyText] = useState('');
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [submittingReply, setSubmittingReply] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Fetch user's support tickets list
  const fetchTickets = async () => {
    if (!user) return;
    try {
      setLoadingTickets(true);
      const res = await api.get('/support/tickets');
      setTickets(res.data || []);
    } catch {
      toast.error('Failed to load support tickets');
    } finally {
      setLoadingTickets(false);
    }
  };

  // Fetch selected ticket details
  const fetchTicketDetails = async (id: string) => {
    try {
      setLoadingDetails(true);
      const res = await api.get(`/support/my-tickets/${id}`);
      setSelectedTicket(res.data.ticket);
      setReplies(res.data.replies || []);
    } catch {
      toast.error('Failed to load ticket conversation');
      setSelectedTicket(null);
    } finally {
      setLoadingDetails(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [user]);

  useEffect(() => {
    if (ticketIdParam) {
      fetchTicketDetails(ticketIdParam);
    } else {
      setSelectedTicket(null);
      setReplies([]);
    }
  }, [ticketIdParam]);

  // Scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [replies]);

  const handleSelectTicket = (id: number) => {
    router.push(`/${locale}/support/chat?ticketId=${id}`);
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;

    try {
      setSubmittingReply(true);
      const res = await api.post(`/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyText('');
      toast.success('Response dispatched to agent!');

      // Reload ticket status from API
      const update = await api.get(`/support/my-tickets/${selectedTicket.id}`);
      setSelectedTicket(update.data.ticket);
      // Reload tickets list to show updated status
      fetchTickets();
    } catch {
      toast.error('Failed to send reply');
    } finally {
      setSubmittingReply(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold text-[8px] uppercase tracking-wider">Open</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[8px] uppercase tracking-wider">Active</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full font-bold text-[8px] uppercase tracking-wider">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-500/10 border border-gray-500/20 text-gray-500 rounded-full font-bold text-[8px] uppercase tracking-wider">Closed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-8">
      <div className="container mx-auto px-4 max-w-6xl">
        
        {/* Navigation Breadcrumbs */}
        <div className="flex items-center justify-between mb-6">
          <Link 
            href={`/${locale}/support`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Support Dashboard
          </Link>
        </div>

        {/* Live Support Split Screen Container */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 rounded-[32px] border border-border/40 bg-card/65 backdrop-blur-md shadow-xl overflow-hidden min-h-[600px] h-[75vh]">
          
          {/* Left Column: Tickets List Sidebar */}
          <div className="md:col-span-1 border-r border-border/40 flex flex-col h-full bg-secondary/5">
            <div className="p-4 border-b border-border/40 bg-card/40 flex items-center justify-between">
              <h2 className="text-xs font-extrabold uppercase tracking-widest text-muted-foreground flex items-center gap-1.5">
                <Inbox size={14} className="text-primary" /> Active Tickets
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-3 space-y-2">
              {loadingTickets ? (
                <div className="space-y-2">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-16 bg-secondary/20 rounded-2xl animate-pulse" />
                  ))}
                </div>
              ) : tickets.length > 0 ? (
                tickets.map((t) => {
                  const isSelected = selectedTicket?.id === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => handleSelectTicket(t.id)}
                      className={`w-full p-3.5 rounded-2xl border text-left transition-all flex flex-col gap-1.5 cursor-pointer ${
                        isSelected 
                          ? 'bg-primary/10 border-primary/30 shadow-sm' 
                          : 'bg-card hover:bg-secondary/40 border-border/30 hover:border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-[10px] font-mono font-bold ${isSelected ? 'text-primary' : 'text-muted-foreground'}`}>
                          #{t.id}
                        </span>
                        {getStatusBadge(t.status)}
                      </div>
                      <p className="text-xs font-bold text-foreground truncate">{t.subject}</p>
                      <p className="text-[10px] text-muted-foreground truncate">{t.message}</p>
                    </button>
                  );
                })
              ) : (
                <div className="text-center py-16 text-muted-foreground text-xs">
                  No active support tickets.
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Active Conversation thread */}
          <div className="md:col-span-2 flex flex-col h-full bg-card/20">
            {selectedTicket ? (
              <>
                {/* Active Ticket Header */}
                <div className="p-4 border-b border-border/40 bg-card/45 backdrop-blur-md flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-mono font-bold text-primary">Ticket #{selectedTicket.id}</span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <h3 className="text-xs md:text-sm font-bold text-foreground truncate max-w-md">{selectedTicket.subject}</h3>
                  </div>
                  <Link 
                    href={`/${locale}/profile/tickets/${selectedTicket.id}`}
                    className="text-[10px] font-bold text-primary hover:underline flex items-center gap-1 shrink-0"
                  >
                    Details <ExternalLink size={11} />
                  </Link>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-5 space-y-4">
                  {/* Original Customer Message */}
                  <div className="flex gap-2 items-start max-w-[85%]">
                    <div className="w-7 h-7 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                      <User size={13} className="text-primary" />
                    </div>
                    <div className="p-3.5 rounded-2xl bg-secondary/15 border border-border/20 text-xs text-foreground space-y-1">
                      <span className="block text-[8px] uppercase font-bold text-muted-foreground mb-0.5">Original Query Request</span>
                      <p className="leading-relaxed whitespace-pre-line">{selectedTicket.message}</p>
                      <span className="block text-[8px] text-muted-foreground text-right mt-1">
                        {new Date(selectedTicket.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* AI Resolution Summary */}
                  {selectedTicket.status === 'resolved' && (
                    <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-2">
                      <div className="flex items-center gap-1.5 font-bold text-emerald-600">
                        <CheckCircle2 size={15} /> Query Resolved
                      </div>
                      {selectedTicket.aiSummary && (
                        <div className="p-3 bg-card/60 rounded-xl border border-emerald-500/5 leading-relaxed text-foreground">
                          <span className="block text-[8px] uppercase font-bold text-muted-foreground mb-1">Resolution Summary</span>
                          {selectedTicket.aiSummary}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Replies Thread */}
                  {replies.map((r) => (
                    <div 
                      key={r.id} 
                      className={`flex gap-2 items-start max-w-[85%] ${r.isAdmin ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
                    >
                      {r.isAdmin && (
                        <div className="w-7 h-7 rounded-full bg-purple-500/10 border border-purple-500/20 flex items-center justify-center shrink-0">
                          <MessageSquare size={13} className="text-purple-500" />
                        </div>
                      )}
                      <div className={`p-3.5 rounded-2xl text-xs space-y-0.5 ${
                        r.isAdmin 
                          ? 'bg-secondary/35 border border-border/30 text-foreground' 
                          : 'bg-primary text-white'
                      }`}>
                        <p className="leading-relaxed">{r.message}</p>
                        <span className={`block text-[8px] text-right ${r.isAdmin ? 'text-muted-foreground' : 'text-white/70'}`}>
                          {new Date(r.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    </div>
                  ))}
                  <div ref={chatEndRef} />
                </div>

                {/* Composer Footer */}
                {selectedTicket.status !== 'resolved' && selectedTicket.status !== 'closed' ? (
                  <div className="p-3 border-t border-border/40 bg-card/45 backdrop-blur-md flex items-center gap-3">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder="Type a message to the agent..."
                      className="flex-1 text-xs p-3 bg-secondary/15 rounded-full border border-border/50 focus:border-primary outline-none transition"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={submittingReply || !replyText.trim()}
                      className="p-3 bg-primary hover:bg-primary/95 text-white rounded-full transition flex items-center justify-center shrink-0 cursor-pointer shadow-md disabled:opacity-50"
                    >
                      <Send size={13} />
                    </button>
                  </div>
                ) : (
                  <div className="p-4 border-t border-border/40 bg-secondary/5 text-center text-xs text-muted-foreground italic">
                    This support ticket is closed and resolved.
                  </div>
                )}
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 gap-3">
                <div className="w-16 h-16 rounded-3xl bg-primary/10 flex items-center justify-center text-primary">
                  <MessageSquare size={32} />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-foreground">Select a Support Ticket</h4>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                    Choose one of your active queries on the left panel to display the conversation log and reply to agents.
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
}
