'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Search, FileText, RefreshCw, ChevronLeft, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';

interface AuditLog {
  id: number;
  action: string;
  actorEmail: string;
  actorId: number;
  metadata: Record<string, any>;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  SUPERADMIN_SUSPEND_USER: 'bg-amber-100 text-amber-700',
  SUPERADMIN_REACTIVATE_USER: 'bg-emerald-100 text-emerald-700',
  SUPERADMIN_PERMANENT_DELETE_USER: 'bg-red-100 text-red-600',
  ADMIN_UPDATE_USER_ROLE: 'bg-blue-100 text-blue-700',
  LOGIN: 'bg-secondary text-muted-foreground',
  LOGOUT: 'bg-secondary text-muted-foreground',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const limit = 20;

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search.trim()) params.set('action', search.trim());
      const res = await api.get(`/admin/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => { setPage(1); fetchLogs(); }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const totalPages = Math.ceil(total / limit);

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Track every admin action across the platform</p>
          </div>
          <button
            onClick={() => fetchLogs()}
            className="flex items-center gap-2 px-4 py-2.5 border border-border/60 rounded-xl hover:bg-secondary/40 text-sm font-medium transition"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={15} />
          <input
            type="text"
            placeholder="Filter by action keyword..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>

        {/* Stats */}
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{total}</span> total log entries
          {search && <span>• filtered by <code className="bg-secondary px-1.5 py-0.5 rounded text-xs">{search}</code></span>}
        </div>

        {/* Log Table */}
        <div className="bg-card border border-border/40 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center h-48">
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/20">
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Actor</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Metadata</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          ACTION_COLORS[log.action] || 'bg-secondary text-muted-foreground'
                        }`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 hidden md:table-cell">
                        <div>
                          <p className="font-medium text-sm">{log.actorEmail}</p>
                          <p className="text-[10px] text-muted-foreground">ID: {log.actorId}</p>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 hidden lg:table-cell max-w-[240px]">
                        <code className="text-[10px] text-muted-foreground font-mono break-all">
                          {JSON.stringify(log.metadata || {}).slice(0, 80)}
                          {JSON.stringify(log.metadata || {}).length > 80 && '...'}
                        </code>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {logs.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No audit logs found</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/40">
              <p className="text-xs text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex items-center gap-1">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage(p => p - 1)}
                  className="p-2 rounded-lg hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronLeft size={16} />
                </button>
                {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                  const p = Math.max(1, page - 2) + i;
                  if (p > totalPages) return null;
                  return (
                    <button
                      key={p}
                      onClick={() => setPage(p)}
                      className={`w-8 h-8 rounded-lg text-xs font-semibold transition ${
                        p === page ? 'bg-primary text-white' : 'hover:bg-secondary/60'
                      }`}
                    >
                      {p}
                    </button>
                  );
                })}
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage(p => p + 1)}
                  className="p-2 rounded-lg hover:bg-secondary/60 disabled:opacity-30 disabled:cursor-not-allowed transition"
                >
                  <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
