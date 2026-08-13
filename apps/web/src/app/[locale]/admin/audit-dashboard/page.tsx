'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { RefreshCw, Shield, Users, Activity, BarChart2, Award, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface DashboardStats {
  recentCount: number;
  topActors: { email: string; count: string }[];
  topEntities: { type: string; count: string }[];
}

interface RecentLog {
  id: number;
  action: string;
  userEmail?: string;
  location?: string;
  createdAt: string;
}

export default function AuditDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const [statsRes, logsRes] = await Promise.all([
        api.get('/admin/audit-logs/stats'),
        api.get('/admin/audit-logs?limit=5'),
      ]);
      setStats(statsRes.data);
      setRecentLogs(logsRes.data.logs || []);
    } catch {
      toast.error('Failed to load audit dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Security & Audit Dashboard</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Real-time platform activity metrics, top system operators, and event timeline</p>
          </div>
          <button
            onClick={fetchDashboardData}
            className="flex items-center gap-2 px-4 py-2.5 border border-border/60 rounded-xl hover:bg-secondary/40 text-sm font-semibold transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Top Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Event count card */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary">
                  <Activity size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Changes (Last 24h)</p>
                  <p className="text-3xl font-extrabold mt-1">{stats?.recentCount || 0}</p>
                </div>
              </div>

              {/* Top Actor Card */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                  <Users size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Top Operator</p>
                  <p className="text-sm font-bold truncate max-w-[200px] mt-1.5">
                    {stats?.topActors?.[0]?.email || 'No logins yet'}
                  </p>
                </div>
              </div>

              {/* Entity Type count card */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 flex items-center gap-4 shadow-sm">
                <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <BarChart2 size={24} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Most Active Entity</p>
                  <p className="text-sm font-bold capitalize mt-1.5">
                    {stats?.topEntities?.[0]?.type || 'N/A'}
                  </p>
                </div>
              </div>
            </div>

            {/* Graphs / Lists Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Actors */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Top Active Operators</h2>
                <div className="divide-y divide-border/30">
                  {stats?.topActors?.map((actor, idx) => (
                    <div key={actor.email} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</span>
                        <span className="text-xs font-semibold text-foreground">{actor.email}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-primary/10 text-primary text-[10px] font-bold rounded-full">
                        {actor.count} events
                      </span>
                    </div>
                  ))}
                  {(!stats?.topActors || stats.topActors.length === 0) && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No events logged yet</p>
                  )}
                </div>
              </div>

              {/* Top Entities */}
              <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Most Modified Entities</h2>
                <div className="divide-y divide-border/30">
                  {stats?.topEntities?.map((entity, idx) => (
                    <div key={entity.type} className="flex items-center justify-between py-3">
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-muted-foreground w-4">#{idx + 1}</span>
                        <span className="text-xs font-semibold capitalize text-foreground">{entity.type}</span>
                      </div>
                      <span className="px-2.5 py-0.5 bg-indigo-500/15 text-indigo-500 text-[10px] font-bold rounded-full">
                        {entity.count} updates
                      </span>
                    </div>
                  ))}
                  {(!stats?.topEntities || stats.topEntities.length === 0) && (
                    <p className="text-xs text-muted-foreground italic text-center py-4">No entity modifications logged yet</p>
                  )}
                </div>
              </div>
            </div>

            {/* Event Timeline (Bottom) */}
            <div className="bg-card border border-border/40 rounded-3xl p-6 space-y-4">
              <div className="flex items-center gap-2">
                <Clock size={16} className="text-primary" />
                <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Recent Event Timeline</h2>
              </div>
              <div className="relative border-l border-border/60 ml-3.5 pl-6 space-y-6 py-2">
                {recentLogs.map((log) => (
                  <div key={log.id} className="relative">
                    <span className="absolute -left-[31px] top-1 w-2.5 h-2.5 rounded-full bg-primary ring-4 ring-card" />
                    <div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                        <span className="text-xs font-bold text-foreground bg-secondary/50 px-2 py-0.5 rounded">
                          {log.action.replace(/_/g, ' ')}
                        </span>
                        <span className="text-[10px] text-muted-foreground">
                          {new Date(log.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Operator: <strong className="text-foreground">{log.userEmail || 'System'}</strong> 
                        {log.location && log.location !== 'Unknown' && ` | Location: ${log.location}`}
                      </p>
                    </div>
                  </div>
                ))}
                {recentLogs.length === 0 && (
                  <p className="text-xs text-muted-foreground italic py-2">No timeline events found</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
