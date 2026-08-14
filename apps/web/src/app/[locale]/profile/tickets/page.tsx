'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Inbox, Clock, CheckCircle2, AlertCircle, ArrowRight, MessageSquare } from 'lucide-react';

import { useAuthStore } from '@/store/authStore';

interface Ticket {
  id: number;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  priority: 'low' | 'medium' | 'high';
  createdAt: string;
}

export default function MyTicketsPage() {
  const { token } = useAuthStore();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  useEffect(() => {
    const fetchTickets = async () => {
      try {
        const response = await api.get('/support/tickets');
        console.log('✅ Tickets fetched:', response.data);
        setTickets(response.data || []);
      } catch (error) {
        console.error('❌ Failed to fetch tickets:', error);
        setTickets([]);
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchTickets();
  }, [token]);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'open':
        return <span className="px-2 py-0.5 bg-red-500/10 border border-red-500/20 text-red-500 rounded-full font-bold text-[9px] uppercase tracking-wider">Open</span>;
      case 'in_progress':
        return <span className="px-2 py-0.5 bg-amber-500/10 border border-amber-500/20 text-amber-500 rounded-full font-bold text-[9px] uppercase tracking-wider">In Progress</span>;
      case 'resolved':
        return <span className="px-2 py-0.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full font-bold text-[9px] uppercase tracking-wider">Resolved</span>;
      default:
        return <span className="px-2 py-0.5 bg-gray-500/10 border border-gray-500/20 text-gray-500 rounded-full font-bold text-[9px] uppercase tracking-wider">Closed</span>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
          <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">Profile</Link>
          <span>/</span>
          <span className="text-foreground">Support Tickets</span>
        </div>

        {/* Header */}
        <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl mb-8 flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Inbox size={22} className="text-primary" /> Support Tickets
            </h1>
            <p className="text-xs text-muted-foreground">
              Track issues, resolutions, and messages with our support team.
            </p>
          </div>
          <Link href={`/${locale}/support`}>
            <button className="px-4 py-2 bg-primary hover:bg-primary/95 text-white rounded-full text-xs font-bold transition shadow-sm cursor-pointer select-none">
              Need Help?
            </button>
          </Link>
        </div>

        {/* Tickets Grid */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-28 bg-card/50 border border-border/40 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : tickets.length > 0 ? (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link 
                key={ticket.id}
                href={`/${locale}/profile/tickets/${ticket.id}`}
                className="block hover:-translate-y-0.5 transition-transform duration-300"
              >
                <div className="p-5 bg-card hover:bg-secondary/10 border border-border/40 hover:border-primary/20 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-primary">Ticket #{ticket.id}</span>
                      {getStatusBadge(ticket.status)}
                    </div>
                    <h3 className="text-sm font-bold text-foreground leading-tight">{ticket.subject}</h3>
                    <p className="text-xs text-muted-foreground line-clamp-1 max-w-xl">{ticket.message}</p>
                  </div>
                  
                  <div className="flex items-center justify-between sm:justify-end gap-6 border-t sm:border-t-0 border-border/10 pt-3 sm:pt-0 shrink-0">
                    <span className="text-[10px] text-muted-foreground font-medium">
                      {new Date(ticket.createdAt).toLocaleDateString([], { month: 'short', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <div className="flex items-center gap-1 text-xs font-bold text-primary hover:translate-x-1 transition-transform">
                      View <ArrowRight size={13} />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-border/40 shadow-sm">
            <MessageSquare size={36} className="mx-auto mb-2 text-primary opacity-20" />
            <p className="text-xs text-muted-foreground font-medium">You haven't opened any support tickets yet.</p>
          </div>
        )}

      </div>
    </div>
  );
}
