'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { RefreshCw, Monitor, MapPin, Key, XCircle, ShieldAlert, CheckCircle, Globe } from 'lucide-react';
import { toast } from 'sonner';

interface ActiveSession {
  id: number;
  userId: number;
  sessionId: string;
  ipAddress?: string;
  userAgent?: string;
  loginTime: string;
  lastActivity: string;
  location?: string;
  user?: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
}

export default function ActiveSessionsPage() {
  const [sessions, setSessions] = useState<ActiveSession[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSessions = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/active-sessions');
      setSessions(res.data || []);
    } catch {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleTerminate = async (sessionId: string) => {
    if (!confirm('Force logout this user session? Their active JWT will be invalidated.')) return;
    try {
      await api.delete(`/admin/active-sessions/${sessionId}`);
      toast.success('Session terminated successfully');
      fetchSessions();
    } catch {
      toast.error('Failed to terminate session');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Active User Sessions</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor active logins, device fingerprints, and terminate sessions remotely</p>
          </div>
          <button
            onClick={fetchSessions}
            className="flex items-center gap-2 px-4 py-2.5 border border-border/60 rounded-xl hover:bg-secondary/40 text-sm font-semibold transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Sessions list */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/20 text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">User</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">IP / Location</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Device / Browser</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Login Time</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Last Activity</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {sessions.map(sess => (
                    <tr key={sess.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {sess.user?.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <div>
                            <span className="font-semibold block text-xs">{sess.user?.name || 'Unknown'}</span>
                            <span className="text-[10px] text-muted-foreground">{sess.user?.email}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span className="font-semibold text-foreground flex items-center gap-1">
                            <Globe size={11} className="text-muted-foreground" />
                            {sess.ipAddress || '127.0.0.1'}
                          </span>
                          <span className="text-[10px] text-primary flex items-center gap-0.5">
                            <MapPin size={10} />
                            {sess.location || 'Unknown'}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground max-w-[200px] truncate">
                        <span className="flex items-center gap-1.5">
                          <Monitor size={12} className="text-primary shrink-0" />
                          <span className="truncate">{sess.userAgent || 'Unknown Agent'}</span>
                        </span>
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {new Date(sess.loginTime).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-xs text-muted-foreground">
                        {new Date(sess.lastActivity).toLocaleString()}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button
                          onClick={() => handleTerminate(sess.sessionId)}
                          className="flex items-center gap-1 px-3 py-1.5 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-lg text-xs font-semibold transition ml-auto"
                        >
                          <XCircle size={12} />
                          Terminate
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {sessions.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <ShieldAlert size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No active user sessions found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
