'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bell, FileText, CheckCircle2, Clock, Check } from 'lucide-react';
import { io } from 'socket.io-client';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export default function UserNotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  const fetchNotifications = async () => {
    try {
      const res = await api.get('/support/my-notifications');
      setNotifications(res.data || []);
    } catch {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();

    // Setup socket to refresh notifications stream
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { transports: ['websocket'] });

    socket.on('ticket_update', () => {
      fetchNotifications();
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/support/my-notifications/read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to update notifications status');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12">
      <div className="container mx-auto px-4 max-w-3xl">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
          <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">Profile</Link>
          <span>/</span>
          <span className="text-foreground">Notifications</span>
        </div>

        {/* Header */}
        <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl mb-8 flex flex-col sm:flex-row justify-between sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Bell size={22} className="text-primary" /> Notifications
            </h1>
            <p className="text-xs text-muted-foreground">
              Inbox alerts regarding orders, subscription updates, and support resolutions.
            </p>
          </div>
          {notifications.some(n => !n.isRead) && (
            <button
              onClick={handleMarkAllRead}
              className="px-4 py-2 bg-primary/10 border border-primary/20 hover:bg-primary/20 text-primary rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer select-none"
            >
              <Check size={14} /> Mark all read
            </button>
          )}
        </div>

        {/* Notifications stream */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-20 bg-card/50 border border-border/40 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notif) => (
              <Link 
                key={notif.id}
                href={notif.link || '#'}
                className="block hover:-translate-y-0.5 transition-transform duration-300"
              >
                <div className={`p-4 bg-card hover:bg-secondary/10 border border-border/40 hover:border-primary/20 rounded-2xl shadow-sm transition-all flex items-start gap-4 ${
                  !notif.isRead ? 'bg-primary/5 border-primary/20' : ''
                }`}>
                  <div className="mt-0.5 text-primary shrink-0 p-2 bg-secondary/20 dark:bg-secondary/10 rounded-xl">
                    <FileText size={16} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-foreground leading-snug">{notif.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{notif.message}</p>
                    
                    <span className="text-[10px] text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock size={11} />
                      {new Date(notif.createdAt).toLocaleDateString([], {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-card rounded-3xl border border-border/40 shadow-sm">
            <CheckCircle2 size={36} className="mx-auto mb-2 text-emerald-500 opacity-20" />
            <p className="text-xs text-muted-foreground font-medium">All caught up! No notifications yet.</p>
          </div>
        )}

      </div>
    </div>
  );
}
