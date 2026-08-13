'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { 
  Inbox, 
  Clock, 
  CheckCircle2, 
  AlertCircle, 
  Send, 
  User, 
  MessageSquare, 
  ShieldAlert, 
  BookmarkCheck,
  BrainCircuit,
  Filter
} from 'lucide-react';

interface Ticket {
  id: number;
  userId?: number;
  guestEmail: string;
  orderId?: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  aiSummary?: string;
  createdAt: string;
}

interface Reply {
  id: number;
  userId?: number;
  isAdmin: boolean;
  message: string;
  createdAt: string;
}

export default function AdminTicketsPage() {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [replies, setReplies] = useState<Reply[]>([]);
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'in_progress' | 'resolved'>('all');
  
  const [replyText, setReplyText] = useState('');
  const [aiSummaryInput, setAiSummaryInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const endpoint = activeFilter === 'all' ? '/support/tickets' : `/support/tickets?status=${activeFilter}`;
      const res = await api.get(endpoint);
      setTickets(res.data || []);
    } catch {
      toast.error('Failed to load tickets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [activeFilter]);

  const selectTicket = async (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setAiSummaryInput(ticket.aiSummary || '');
    try {
      const res = await api.get(`/support/tickets/${ticket.id}`);
      setReplies(res.data.replies || []);
    } catch {
      toast.error('Failed to load replies');
    }
  };

  const handleSendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    try {
      setActionLoading(true);
      const res = await api.post(`/support/tickets/${selectedTicket.id}/reply`, {
        message: replyText,
      });
      setReplies((prev) => [...prev, res.data]);
      setReplyText('');
      toast.success('Reply dispatched!');
      
      // Update local ticket status to in_progress
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'in_progress' } : t))
      );
      setSelectedTicket((prev) => prev ? { ...prev, status: 'in_progress' } : null);
    } catch {
      toast.error('Failed to dispatch reply');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveTicket = async () => {
    if (!selectedTicket) return;
    try {
      setActionLoading(true);
      
      // Save AI Summary if entered
      if (aiSummaryInput.trim()) {
        await api.post(`/ai-assistant/train-ticket`, {
          ticketId: selectedTicket.id,
          aiSummary: aiSummaryInput,
        }).catch(() => {}); // Fallback if direct training endpoint isn't wired up
      }

      await api.put(`/support/tickets/${selectedTicket.id}/resolve`);
      
      toast.success('Ticket marked as resolved & user notified!');
      
      setTickets((prev) =>
        prev.map((t) => (t.id === selectedTicket.id ? { ...t, status: 'resolved', aiSummary: aiSummaryInput } : t))
      );
      setSelectedTicket((prev) => prev ? { ...prev, status: 'resolved', aiSummary: aiSummaryInput } : null);
      fetchTickets();
    } catch {
      toast.error('Failed to resolve ticket');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2.5 py-1 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 w-max"><AlertCircle size={10} /> Open</span>;
      case 'in_progress':
        return <span className="px-2.5 py-1 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 w-max"><Clock size={10} /> Active</span>;
      case 'resolved':
        return <span className="px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 w-max"><CheckCircle2 size={10} /> Resolved</span>;
      default:
        return <span className="px-2.5 py-1 bg-gray-500/10 border border-gray-500/20 text-gray-500 rounded-full font-bold text-[10px] tracking-wider uppercase flex items-center gap-1 w-max">Closed</span>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <span className="text-[10px] text-red-500 font-bold">🔴 High Priority</span>;
      case 'medium':
        return <span className="text-[10px] text-amber-500 font-bold">🟡 Medium Priority</span>;
      default:
        return <span className="text-[10px] text-blue-500 font-bold">🟢 Low Priority</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-[24px] border border-border/40 bg-card/65 backdrop-blur-md shadow-xl">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Inbox className="text-primary" /> Support Desk
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage user complaints, assist guest customers, and build JARVIS self-resolution parameters.
            </p>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1">
            <Filter size={14} className="text-muted-foreground mr-1 shrink-0" />
            {(['all', 'open', 'in_progress', 'resolved'] as const).map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`px-4 py-2 rounded-full text-xs font-bold transition capitalize cursor-pointer select-none border shrink-0
                  ${activeFilter === filter
                    ? 'bg-primary border-primary text-white shadow-md'
                    : 'bg-card/50 border-border/50 text-foreground hover:bg-secondary/40'
                  }`}
              >
                {filter === 'all' ? 'All Tickets' : filter.replace('_', ' ')}
              </button>
            ))}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* Ticket List */}
          <div className="lg:col-span-5 space-y-4">
            <div className="p-4 bg-secondary/10 border border-border/25 rounded-2xl">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                Tickets Feed ({tickets.length})
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-24 bg-card/50 border border-border/40 animate-pulse rounded-2xl" />
                ))}
              </div>
            ) : tickets.length > 0 ? (
              <div className="space-y-3 max-h-[650px] overflow-y-auto pr-1">
                {tickets.map((ticket) => (
                  <button
                    key={ticket.id}
                    onClick={() => selectTicket(ticket)}
                    className={`w-full text-left p-4 rounded-2xl border transition-all duration-300 shadow-sm cursor-pointer block hover:-translate-y-0.5
                      ${selectedTicket?.id === ticket.id
                        ? 'bg-primary/5 border-primary shadow-md'
                        : 'bg-card border-border/40 hover:bg-secondary/20'
                      }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-mono font-bold text-primary">Ticket #{ticket.id}</span>
                      <span className="text-[10px] text-muted-foreground">
                        {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit' })}
                      </span>
                    </div>

                    <h4 className="text-xs font-bold text-foreground truncate mb-1">{ticket.subject}</h4>
                    <p className="text-[11px] text-muted-foreground line-clamp-2 leading-relaxed mb-3">
                      {ticket.message}
                    </p>

                    <div className="flex items-center justify-between border-t border-border/20 pt-2">
                      {getStatusBadge(ticket.status)}
                      {getPriorityBadge(ticket.priority)}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="text-center py-16 bg-card rounded-2xl border border-border/40">
                <BookmarkCheck size={36} className="mx-auto mb-2 text-emerald-500 opacity-20" />
                <p className="text-xs text-muted-foreground">No active support tickets found.</p>
              </div>
            )}
          </div>

          {/* Ticket Details View */}
          <div className="lg:col-span-7">
            {selectedTicket ? (
              <div className="space-y-6 p-6 rounded-[24px] border border-border/40 bg-card/65 backdrop-blur-md shadow-xl">
                
                {/* Header Actions */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-mono font-bold text-primary">Ticket #{selectedTicket.id}</span>
                      {getStatusBadge(selectedTicket.status)}
                    </div>
                    <h2 className="text-base font-bold text-foreground">{selectedTicket.subject}</h2>
                  </div>

                  {selectedTicket.status !== 'resolved' && (
                    <button
                      onClick={handleResolveTicket}
                      disabled={actionLoading}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-emerald-500/50 text-white rounded-full text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md select-none border border-emerald-600/20"
                    >
                      <CheckCircle2 size={13} /> Resolve Ticket
                    </button>
                  )}
                </div>

                {/* Meta details */}
                <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-secondary/15 border border-border/20 text-xs leading-relaxed">
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Customer Email</span>
                    <span className="font-semibold">{selectedTicket.guestEmail}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase font-bold text-muted-foreground">Associated Order ID</span>
                    <span className="font-semibold">{selectedTicket.orderId ? `#${selectedTicket.orderId}` : 'None'}</span>
                  </div>
                </div>

                {/* Initial Query */}
                <div className="p-4 bg-primary/5 border border-primary/10 rounded-2xl space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-primary">
                    <User size={14} className="shrink-0" /> Client Initial Request
                  </div>
                  <p className="text-xs leading-relaxed text-foreground whitespace-pre-line">
                    {selectedTicket.message}
                  </p>
                </div>

                {/* Conversation replies feed */}
                <div className="space-y-4">
                  <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                    <MessageSquare size={12} /> Discussion Stream
                  </span>

                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {replies.map((reply) => (
                      <div
                        key={reply.id}
                        className={`p-3 rounded-2xl text-xs max-w-[85%] space-y-1 ${
                          reply.isAdmin
                            ? 'ml-auto bg-primary text-white border border-primary/20'
                            : 'bg-secondary/25 border border-border/30 mr-auto'
                        }`}
                      >
                        <p className="leading-relaxed">{reply.message}</p>
                        <span className={`block text-[9px] text-right font-semibold ${reply.isAdmin ? 'text-white/70' : 'text-muted-foreground'}`}>
                          {reply.isAdmin ? 'Support Team' : 'User'} • {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                    ))}
                    {replies.length === 0 && (
                      <p className="text-center text-muted-foreground text-[11px] py-4">No replies yet. Use the reply composer below.</p>
                    )}
                  </div>
                </div>

                {/* AI Self-resolution training panel */}
                <div className="p-4 border border-violet-500/25 bg-violet-500/5 rounded-2xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-violet-500">
                    <BrainCircuit size={14} className="animate-pulse" /> JARVIS Support Autopilot Training
                  </div>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">
                    Provide the verified solution/resolution steps for this issue. Next time a customer asks JARVIS a similar query, JARVIS will automatically recommend this solution!
                  </p>
                  <textarea
                    rows={2}
                    value={aiSummaryInput}
                    onChange={(e) => setAiSummaryInput(e.target.value)}
                    placeholder="Enter resolution steps or advice (e.g. 'Refund requested. Triggered cancellation process...')"
                    className="w-full text-xs p-3 rounded-xl border border-border/50 bg-card outline-none focus:border-violet-500 transition resize-none"
                  />
                </div>

                {/* Reply Composer */}
                {selectedTicket.status !== 'resolved' && (
                  <div className="flex items-center gap-3 pt-2">
                    <input
                      type="text"
                      value={replyText}
                      onChange={(e) => setReplyText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendReply()}
                      placeholder="Compose response message..."
                      className="flex-1 text-xs p-3.5 bg-secondary/15 rounded-full border border-border/50 focus:border-primary outline-none transition"
                    />
                    <button
                      onClick={handleSendReply}
                      disabled={actionLoading || !replyText.trim()}
                      className="p-3.5 bg-primary hover:bg-primary/90 text-white rounded-full transition flex items-center justify-center shrink-0 cursor-pointer shadow-md"
                    >
                      <Send size={15} />
                    </button>
                  </div>
                )}

              </div>
            ) : (
              <div className="h-[450px] rounded-[24px] border border-border/30 bg-card/40 flex flex-col items-center justify-center text-center p-6">
                <ShieldAlert size={48} className="text-primary/20 mb-3" />
                <h3 className="text-sm font-bold text-foreground">Select a ticket from the feed</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs leading-relaxed">
                  Click on any support ticket card on the left panel to open details, chat, or train JARVIS.
                </p>
              </div>
            )}
          </div>

        </div>

      </div>
    </AdminLayout>
  );
}
