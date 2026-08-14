'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import { io } from 'socket.io-client';
import { 
  Bell, 
  ShoppingBag, 
  AlertTriangle, 
  MessageSquare,
  CheckCircle,
  Clock
} from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface AppNotification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    try {
      const response = await api.get('/support/notifications');
      setNotifications(response.data || []);
    } catch {
      console.warn('Failed to load notifications');
    }
  };

  const playAlertSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-84.wav');
      audio.volume = 0.45;
      audio.play().catch(() => {});
    } catch {}
  };

  useEffect(() => {
    fetchNotifications();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { transports: ['websocket'] });

    socket.on('new_order', (data: any) => {
      toast.success(`🛍️ New Order Received`, {
        description: `Order #${data.orderId} of $${Number(data.total).toFixed(2)} received from ${data.email}.`,
      });
      playAlertSound();
      fetchNotifications();
    });

    socket.on('low_stock', (data: any) => {
      toast.warning(`🚨 Low Stock Alert`, {
        description: `Product "${data.name}" inventory dropped to ${data.stock} units.`,
      });
      playAlertSound();
      fetchNotifications();
    });

    socket.on('new_ticket', (data: any) => {
      toast.info(`💬 New Ticket #${data.ticketId} from ${data.userName}`, {
        description: data.subject,
      });
      playAlertSound();
      fetchNotifications();
    });

    socket.on('ticket_update', () => {
      fetchNotifications();
    });

    // Close on click outside
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      socket.disconnect();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.put('/support/notifications/read');
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      toast.success('All notifications marked as read');
    } catch {
      toast.error('Failed to clear notifications');
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case 'low_stock':
        return <AlertTriangle size={14} className="text-rose-400 shrink-0" />;
      case 'new_ticket':
        return <MessageSquare size={14} className="text-blue-400 shrink-0" />;
      case 'new_order':
      default:
        return <ShoppingBag size={14} className="text-emerald-400 shrink-0" />;
    }
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2.5 hover:bg-secondary/40 dark:hover:bg-secondary/20 rounded-xl transition cursor-pointer text-foreground"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-primary text-white text-[9px] font-bold rounded-full flex items-center justify-center animate-bounce shadow-md">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-80 bg-card border border-border/60 rounded-2xl shadow-2xl z-[999] overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border/40 bg-secondary/15">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notifications</span>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="text-[10px] font-bold text-primary hover:underline cursor-pointer"
              >
                Mark all read
              </button>
            )}
          </div>

          <div className="max-h-64 overflow-y-auto divide-y divide-border/30">
            {notifications.map((notif) => (
              <Link
                key={notif.id}
                href={notif.link || '#'}
                onClick={() => setIsOpen(false)}
                className={`block p-3.5 hover:bg-secondary/40 transition-colors text-left ${
                  !notif.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 text-primary shrink-0">
                    {getIcon(notif.type)}
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-foreground">{notif.title}</h4>
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                      {notif.message}
                    </p>
                    <span className="text-[9px] text-primary mt-1.5 flex items-center gap-0.5 font-semibold">
                      <Clock size={10} />
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

            {notifications.length === 0 && (
              <div className="text-center py-10 text-muted-foreground">
                <CheckCircle size={28} className="mx-auto mb-2 opacity-20 text-emerald-500" />
                <p className="text-xs font-medium">All caught up! No notifications</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
export default NotificationCenter;
