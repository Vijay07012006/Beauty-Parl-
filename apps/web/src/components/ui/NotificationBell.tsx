'use client';

import { useState, useEffect, useRef } from 'react';
import { api } from '@/lib/api';
import { Bell, FileText, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';
import { io } from 'socket.io-client';
import { useAuthStore } from '@/store/authStore';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
}

export function UserNotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const { user } = useAuthStore();
  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const fetchNotifications = async () => {
    if (!user) return;
    try {
      const res = await api.get('/support/my-notifications');
      setNotifications(res.data || []);
    } catch {
      console.warn('Failed to load user notifications');
    }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();

    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(socketUrl, { transports: ['websocket'] });

    socket.on('ticket_update', () => {
      fetchNotifications();
    });

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
  }, [user]);

  if (!user) return null;

  const displayList = notifications.slice(0, 5);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-secondary rounded-full transition-colors cursor-pointer text-foreground"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4.5 h-4.5 rounded-full flex items-center justify-center font-bold">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 bg-card border border-border/50 rounded-2xl shadow-xl z-50 overflow-hidden text-xs">
          <div className="flex items-center justify-between p-3 border-b border-border/30 bg-secondary/10">
            <span className="font-bold">Notifications</span>
            <Link href="/en/profile/notifications" onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="divide-y divide-border/20 max-h-56 overflow-y-auto">
            {displayList.map((notif) => (
              <Link
                key={notif.id}
                href={notif.link || '/en/profile/notifications'}
                onClick={() => setIsOpen(false)}
                className={`block p-3 hover:bg-secondary/40 transition-colors text-left ${
                  !notif.isRead ? 'bg-primary/5' : ''
                }`}
              >
                <h4 className="font-bold text-[11px] text-foreground">{notif.title}</h4>
                <p className="text-[10px] text-muted-foreground mt-0.5 line-clamp-2 leading-relaxed">
                  {notif.message}
                </p>
              </Link>
            ))}

            {notifications.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="text-[11px]">No alerts found</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
