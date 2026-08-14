'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  LifeBuoy, 
  MessageSquareCode, 
  FileText, 
  History, 
  HelpCircle, 
  ArrowRight, 
  Send,
  Sparkles,
  Inbox,
  AlertCircle
} from 'lucide-react';

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  createdAt: string;
}

const FAQS = [
  {
    question: 'How do I schedule an appointment?',
    answer: 'Simply click "Book Appointment" in the top navigation, select your preferred artist, choose a date/time slot, and complete the booking form.'
  },
  {
    question: 'Where can I track my product delivery?',
    answer: 'Once your order is placed, you can view its timeline and status in your profile under the "Orders" page.'
  },
  {
    question: 'What is Clean Beauty?',
    answer: 'Our Clean Beauty curated products are 100% natural, toxicity-free, vegan-friendly, and organic cosmetics designed for all skin types.'
  },
  {
    question: 'How does the AI Skin Analysis work?',
    answer: 'Go to the Skin Analysis page, upload a selfie, and our AI model will analyze your skin type, hydration levels, and recommend a personalized day/night routine.'
  }
];

export default function SupportDashboard() {
  const { user } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);

  // Form states
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // FAQ accordion state
  const [openFaqIdx, setOpenFaqIdx] = useState<number | null>(null);

  const fetchRecentTickets = async () => {
    if (!user) return;
    try {
      setLoadingHistory(true);
      const res = await api.get('/support/tickets');
      // Show only recent 5
      setTickets((res.data || []).slice(0, 5));
    } catch {
      console.warn('Failed to load tickets history');
    } finally {
      setLoadingHistory(false);
    }
  };

  useEffect(() => {
    fetchRecentTickets();
  }, [user]);

  const handleOpenJarvis = () => {
    window.dispatchEvent(new CustomEvent('open-jarvis', { detail: 'raise a ticket' }));
  };

  const handleRaiseTicket = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to raise a support ticket');
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast.error('Please enter a subject and message');
      return;
    }

    try {
      setSubmitting(true);
      await api.post('/support/tickets', {
        subject,
        message,
        orderId: orderId ? parseInt(orderId, 10) : undefined
      });
      toast.success('🎉 Support ticket raised successfully!');
      setSubject('');
      setMessage('');
      setOrderId('');
      // Reload ticket list
      fetchRecentTickets();
    } catch {
      toast.error('Failed to raise ticket. Please try again.');
    } finally {
      setSubmitting(false);
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
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">

        {/* Hero Section */}
        <div className="text-center space-y-3 mb-12">
          <div className="inline-flex p-3 bg-primary/10 rounded-2xl border border-primary/20 text-primary">
            <LifeBuoy className="w-8 h-8 animate-spin-slow" />
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">Customer Support Dashboard</h1>
          <p className="text-xs md:text-sm text-muted-foreground max-w-xl mx-auto">
            Get instant solutions from our JARVIS AI assistant, submit formal queries, and track active tickets.
          </p>
        </div>

        {/* Quick Actions / Jarvis Entry */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          
          {/* JARVIS Live Chat */}
          <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-500/10 border border-purple-500/20 text-purple-500 rounded-lg">
                  <Sparkles size={16} />
                </div>
                <h3 className="text-sm font-bold text-foreground">Interactive JARVIS AI Support</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Connect immediately with JARVIS to track your shipment status, compare products, query loyalty points, or automatically raise support tickets using voice commands.
              </p>
            </div>
            <button
              onClick={handleOpenJarvis}
              className="w-full py-3 bg-gradient-to-r from-primary to-purple-600 hover:opacity-95 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition shadow-md cursor-pointer select-none"
            >
              <MessageSquareCode size={15} /> Talk to JARVIS Assistant <ArrowRight size={13} />
            </button>
          </div>

          {/* Quick Ticket Actions */}
          <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg">
                  <Inbox size={16} />
                </div>
                <h3 className="text-sm font-bold text-foreground">My Support Tickets</h3>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                View your conversation history with our support agents, respond to updates, check resolutions, or manage active claims.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <a href="#raise-form" className="w-full">
                <button className="w-full py-3 bg-secondary hover:bg-secondary/70 border border-border/50 text-foreground font-bold rounded-xl text-xs transition cursor-pointer select-none">
                  Raise a Ticket
                </button>
              </a>
              <Link href={`/${locale}/support/chat`} className="w-full">
                <button className="w-full py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs transition cursor-pointer select-none">
                  Live Ticket Chat
                </button>
              </Link>
            </div>
          </div>

        </div>

        {/* Form and History Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
          
          {/* Raise a Ticket form */}
          <div id="raise-form" className="lg:col-span-2 p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl space-y-4">
            <h2 className="text-sm font-bold flex items-center gap-2">
              <FileText className="text-primary w-4.5 h-4.5" /> Raise a Formal Support Ticket
            </h2>
            <form onSubmit={handleRaiseTicket} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Subject *</label>
                  <input
                    type="text"
                    required
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="e.g. Broken item received"
                    className="w-full text-xs p-3 bg-secondary/15 rounded-xl border border-border/50 focus:border-primary outline-none transition"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Order ID (Optional)</label>
                  <input
                    type="number"
                    value={orderId}
                    onChange={(e) => setOrderId(e.target.value)}
                    placeholder="e.g. 102"
                    className="w-full text-xs p-3 bg-secondary/15 rounded-xl border border-border/50 focus:border-primary outline-none transition"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">Message Body *</label>
                <textarea
                  required
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Detail your request, our support team will respond shortly..."
                  className="w-full text-xs p-3 bg-secondary/15 rounded-xl border border-border/50 focus:border-primary outline-none transition resize-none"
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer select-none shadow-sm ml-auto disabled:opacity-50"
              >
                <Send size={13} /> {submitting ? 'Submitting...' : 'Submit Ticket'}
              </button>
            </form>
          </div>

          {/* Ticket History (recent 5) */}
          <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <h2 className="text-sm font-bold flex items-center gap-2">
                <History className="text-primary w-4.5 h-4.5" /> Recent Tickets History
              </h2>
              
              {loadingHistory ? (
                <div className="space-y-2">
                  {[...Array(3)].map((_, i) => (
                    <div key={i} className="h-10 bg-secondary/20 rounded-xl animate-pulse" />
                  ))}
                </div>
              ) : tickets.length > 0 ? (
                <div className="space-y-2.5 max-h-[250px] overflow-y-auto pr-1">
                  {tickets.map((t) => (
                    <Link 
                      key={t.id}
                      href={`/${locale}/support/chat?ticketId=${t.id}`}
                      className="block p-3 rounded-xl bg-secondary/10 border border-border/30 hover:border-primary/20 transition-all"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[10px] font-mono font-bold text-primary">#{t.id}</span>
                        {getStatusBadge(t.status)}
                      </div>
                      <p className="text-[10px] font-bold text-foreground truncate mt-1">{t.subject}</p>
                    </Link>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-xs">
                  <AlertCircle size={20} className="mx-auto mb-1 opacity-25" />
                  No tickets found
                </div>
              )}
            </div>
            {tickets.length > 0 && (
              <Link href={`/${locale}/profile/tickets`} className="text-[11px] font-bold text-primary hover:underline flex items-center gap-1.5 mt-2 self-start">
                View all tickets <ArrowRight size={12} />
              </Link>
            )}
          </div>

        </div>

        {/* Quick FAQs */}
        <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl space-y-4">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <HelpCircle className="text-primary w-4.5 h-4.5" /> Quick FAQs
          </h2>
          <div className="divide-y divide-border/30">
            {FAQS.map((faq, idx) => {
              const isOpen = openFaqIdx === idx;
              return (
                <div key={idx} className="py-3">
                  <button
                    onClick={() => setOpenFaqIdx(isOpen ? null : idx)}
                    className="w-full flex items-center justify-between text-left text-xs font-bold text-foreground hover:text-primary transition-colors cursor-pointer select-none"
                  >
                    <span>{faq.question}</span>
                    <span className="text-base font-normal shrink-0 ml-4">{isOpen ? '−' : '+'}</span>
                  </button>
                  {isOpen && (
                    <p className="text-xs text-muted-foreground mt-2 leading-relaxed animate-fade-in pr-6">
                      {faq.answer}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
