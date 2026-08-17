'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Monitor, Smartphone, Tablet, Clock, Globe, Shield, Power, LogOut, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface Session {
  id: number;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  deviceType?: string;
  loginTime: string;
  lastActivity: string;
  isActive: boolean;
  location?: string;
}

export default function SessionsPage() {
  const { token, hydrate } = useAuthStore();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  useEffect(() => {
    hydrate();
  }, []);

  const fetchSessions = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/sessions', { withCredentials: true });
      setSessions(response.data || []);
    } catch (error) {
      console.error('Failed to fetch sessions:', error);
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, [token]);

  const handleForceLogout = async (sessionId: string) => {
    setActionLoading(sessionId);
    try {
      await api.delete(`/sessions/${sessionId}`, { withCredentials: true });
      toast.success('Device logged out successfully');
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
    } catch (error) {
      console.error('Failed to log out device:', error);
      toast.error('Failed to log out device');
    } finally {
      setActionLoading(null);
    }
  };

  const handleLogoutAllOther = async () => {
    setActionLoading('all');
    try {
      await api.delete('/sessions/all', { withCredentials: true });
      toast.success('Logged out of all other devices');
      await fetchSessions();
    } catch (error) {
      console.error('Failed to log out all other devices:', error);
      toast.error('Failed to log out other devices');
    } finally {
      setActionLoading(null);
    }
  };

  const getDeviceIcon = (deviceType?: string) => {
    switch (deviceType?.toLowerCase()) {
      case 'mobile':
        return <Smartphone className="text-primary w-5 h-5" />;
      case 'tablet':
        return <Tablet className="text-primary w-5 h-5" />;
      default:
        return <Monitor className="text-primary w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
          <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">Profile</Link>
          <span>/</span>
          <span className="text-foreground">Active Sessions</span>
        </div>

        {/* Header */}
        <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Shield size={22} className="text-primary" /> Device Sessions
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your active sessions and log out of other devices remotely.
            </p>
          </div>
          {sessions.length > 1 && (
            <button
              onClick={handleLogoutAllOther}
              disabled={actionLoading !== null}
              className="flex items-center gap-2 px-4 py-2 border border-red-500/20 bg-red-500/10 hover:bg-red-500/15 text-red-500 rounded-full text-xs font-bold transition shadow-sm cursor-pointer select-none disabled:opacity-50"
            >
              {actionLoading === 'all' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : (
                <LogOut size={14} />
              )}
              Logout Other Devices
            </button>
          )}
        </div>

        {/* Sessions List */}
        {loading ? (
          <div className="space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="h-28 bg-card/50 border border-border/40 animate-pulse rounded-3xl" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div 
                key={session.id}
                className="p-5 bg-card border border-border/40 rounded-3xl shadow-sm hover:shadow-md transition-all flex flex-col sm:flex-row justify-between sm:items-center gap-4"
              >
                <div className="flex gap-4 items-start sm:items-center">
                  <div className="p-3 bg-primary/10 rounded-2xl shrink-0">
                    {getDeviceIcon(session.deviceType)}
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-sm font-bold text-foreground">
                        {session.deviceType || 'Desktop'} Device
                      </span>
                      {session.ipAddress && (
                        <span className="px-2 py-0.5 bg-secondary text-muted-foreground rounded-full text-[10px] font-semibold">
                          {session.ipAddress}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1">
                        <Globe size={12} /> {session.location || 'Unknown location'}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock size={12} /> Last active: {new Date(session.lastActivity).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-[10px] text-muted-foreground font-mono line-clamp-1 max-w-md">
                      {session.userAgent}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-end">
                  <button
                    onClick={() => handleForceLogout(session.sessionId)}
                    disabled={actionLoading !== null}
                    className="p-2 border border-border hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-500 rounded-2xl transition cursor-pointer disabled:opacity-50"
                    title="Force Logout"
                  >
                    {actionLoading === session.sessionId ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Power size={16} />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 bg-card border border-border/40 rounded-3xl text-muted-foreground">
            <Shield size={36} className="mx-auto mb-3 opacity-20" />
            <p className="text-sm font-semibold">No active sessions found</p>
          </div>
        )}
      </div>
    </div>
  );
}
