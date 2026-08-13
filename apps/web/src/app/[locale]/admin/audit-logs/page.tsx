'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Search, FileText, RefreshCw, ChevronLeft, ChevronRight, Download, Eye, Calendar, Globe, Monitor, Terminal, ShieldAlert, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';

interface AuditLog {
  id: number;
  action: string;
  userEmail?: string;
  userId?: number;
  details?: string;
  ipAddress?: string;
  userAgent?: string;
  sessionId?: string;
  entityType?: string;
  entityId?: number;
  beforeValue?: any;
  afterValue?: any;
  location?: string;
  status?: string;
  createdAt: string;
}

const ACTION_COLORS: Record<string, string> = {
  SUPERADMIN_SUSPEND_USER: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  SUPERADMIN_REACTIVATE_USER: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  SUPERADMIN_PERMANENT_DELETE_USER: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
  ADMIN_UPDATE_USER_ROLE: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  USER_LOGIN: 'bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-300',
  USER_REGISTERED: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filters
  const [searchAction, setSearchAction] = useState('');
  const [filterUser, setFilterUser] = useState('');
  const [filterEntityType, setFilterEntityType] = useState('');
  const [filterIp, setFilterIp] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  
  const [page, setPage] = useState(1);
  const limit = 20;

  // Selected log for detailed view modal
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: String(limit),
      });
      if (searchAction.trim()) params.set('action', searchAction.trim());
      // Other filters will be handled locally or passed if supported
      const res = await api.get(`/admin/audit-logs?${params}`);
      setLogs(res.data.logs || []);
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  }, [page, searchAction]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Debounced action filter
  useEffect(() => {
    const t = setTimeout(() => {
      setPage(1);
      fetchLogs();
    }, 400);
    return () => clearTimeout(t);
  }, [searchAction]);

  const totalPages = Math.ceil(total / limit);

  // Apply other advanced client-side filters for instant premium interaction
  const filteredLogs = logs.filter(log => {
    const matchUser = !filterUser.trim() || log.userEmail?.toLowerCase().includes(filterUser.toLowerCase());
    const matchEntity = !filterEntityType.trim() || log.entityType?.toLowerCase().includes(filterEntityType.toLowerCase());
    const matchIp = !filterIp.trim() || log.ipAddress?.includes(filterIp);
    const matchStatus = filterStatus === 'all' || log.status === filterStatus;
    return matchUser && matchEntity && matchIp && matchStatus;
  });

  // Export CSV
  const handleExportCSV = () => {
    try {
      const headers = ['ID', 'Action', 'User', 'IP Address', 'Location', 'Entity Type', 'Entity ID', 'Status', 'Date'];
      const rows = filteredLogs.map(l => [
        l.id,
        l.action,
        l.userEmail || 'N/A',
        l.ipAddress || 'N/A',
        l.location || 'N/A',
        l.entityType || 'N/A',
        l.entityId || 'N/A',
        l.status || 'success',
        new Date(l.createdAt).toLocaleString(),
      ]);

      const csvContent = 'data:text/csv;charset=utf-8,' 
        + [headers.join(','), ...rows.map(e => e.map(val => `"${val}"`).join(','))].join('\n');
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute('download', `beauty_parle_audit_logs_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success('Audit logs exported to CSV!');
    } catch {
      toast.error('Failed to export CSV');
    }
  };

  // Export PDF compliance report
  const handleExportPDF = () => {
    try {
      const doc = new jsPDF();
      doc.setFont('Helvetica', 'bold');
      doc.setFontSize(20);
      doc.text('Beauty Parlé — Compliance Audit Report', 15, 20);
      
      doc.setFontSize(10);
      doc.setFont('Helvetica', 'normal');
      doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 28);
      doc.text(`Total Records: ${filteredLogs.length}`, 15, 33);
      
      let y = 45;
      doc.line(15, y - 5, 195, y - 5);
      
      filteredLogs.forEach((l, idx) => {
        if (y > 270) {
          doc.addPage();
          y = 20;
        }
        
        doc.setFont('Helvetica', 'bold');
        doc.text(`${idx + 1}. [${l.action}]`, 15, y);
        doc.setFont('Helvetica', 'normal');
        doc.text(`Actor: ${l.userEmail || 'N/A'} | IP: ${l.ipAddress || 'N/A'} | Location: ${l.location || 'N/A'}`, 15, y + 5);
        doc.text(`Status: ${l.status || 'success'} | Entity: ${l.entityType || 'N/A'} (ID: ${l.entityId || 'N/A'})`, 15, y + 10);
        doc.text(`Date: ${new Date(l.createdAt).toLocaleString()}`, 15, y + 15);
        
        y += 25;
      });

      doc.save(`beauty_parle_audit_report_${Date.now()}.pdf`);
      toast.success('Compliance report exported to PDF!');
    } catch {
      toast.error('Failed to export PDF');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Enterprise Audit Logs</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Audit-proof records, data values diff, and active user monitoring</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-3 py-2 border border-border/60 rounded-xl hover:bg-secondary/40 text-xs font-semibold transition"
            >
              <Download size={14} />
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-2 px-3 py-2 bg-primary text-white rounded-xl text-xs font-semibold hover:bg-primary/95 transition shadow-sm"
            >
              <Download size={14} />
              PDF Compliance Report
            </button>
            <button
              onClick={() => fetchLogs()}
              className="flex items-center gap-2 p-2 border border-border/60 rounded-xl hover:bg-secondary/40 transition"
              title="Refresh"
            >
              <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
            </button>
          </div>
        </div>

        {/* Advanced Filters */}
        <div className="bg-card border border-border/40 rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={14} />
            <input
              type="text"
              placeholder="Action keyword..."
              value={searchAction}
              onChange={e => setSearchAction(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-border/60 rounded-xl bg-background focus:outline-none"
            />
          </div>

          <input
            type="text"
            placeholder="User Email..."
            value={filterUser}
            onChange={e => setFilterUser(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-border/60 rounded-xl bg-background focus:outline-none"
          />

          <input
            type="text"
            placeholder="Entity Type (e.g. Product)..."
            value={filterEntityType}
            onChange={e => setFilterEntityType(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-border/60 rounded-xl bg-background focus:outline-none"
          />

          <input
            type="text"
            placeholder="IP Address..."
            value={filterIp}
            onChange={e => setFilterIp(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-border/60 rounded-xl bg-background focus:outline-none"
          />

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="w-full px-3 py-2 text-xs border border-border/60 rounded-xl bg-background focus:outline-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>
        </div>

        {/* Stats Summary */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          <span>Showing <strong className="text-foreground">{filteredLogs.length}</strong> of {total} total records</span>
        </div>

        {/* Log Table */}
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
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Action</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Actor</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">IP / Location</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Target Entity</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3 text-right font-semibold uppercase tracking-wider">Time</th>
                    <th className="px-5 py-3 text-right">Details</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filteredLogs.map(log => (
                    <tr key={log.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          ACTION_COLORS[log.action] || 'bg-secondary text-muted-foreground'
                        }`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="font-semibold block text-xs">{log.userEmail || 'System'}</span>
                        {log.userId && <span className="text-[10px] text-muted-foreground">ID: {log.userId}</span>}
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        <div className="flex flex-col">
                          <span>{log.ipAddress || 'N/A'}</span>
                          <span className="text-[10px] text-primary">{log.location || 'Unknown location'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground">
                        {log.entityType ? (
                          <span>
                            <strong className="text-foreground">{log.entityType}</strong> (ID: {log.entityId})
                          </span>
                        ) : (
                          <span className="italic text-[10px]">N/A</span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className={`inline-flex items-center gap-1 font-semibold ${
                          log.status === 'failed' ? 'text-red-500' : 'text-emerald-600'
                        }`}>
                          {log.status === 'failed' ? <XCircle size={12} /> : <CheckCircle size={12} />}
                          {log.status || 'success'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap text-xs text-muted-foreground">
                        {new Date(log.createdAt).toLocaleString([], {
                          day: '2-digit',
                          month: 'short',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="px-5 py-3.5 text-right">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 hover:bg-secondary rounded-lg text-primary transition"
                          title="View Details"
                        >
                          <Eye size={14} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filteredLogs.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <FileText size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No matching audit logs found</p>
                </div>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-5 py-4 border-t border-border/40 bg-secondary/10">
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

      {/* Details / Diff Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-2xl shadow-2xl max-h-[85vh] overflow-y-auto">
            <h2 className="text-lg font-bold mb-1">Audit Log Details</h2>
            <p className="text-xs text-muted-foreground mb-4">Record #{selectedLog.id} | Action: {selectedLog.action}</p>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 bg-secondary/10 p-3 rounded-2xl text-xs text-muted-foreground">
                <div className="space-y-1">
                  <p><strong>Actor:</strong> {selectedLog.userEmail || 'System'}</p>
                  <p><strong>IP Address:</strong> {selectedLog.ipAddress || 'N/A'}</p>
                  <p><strong>Location:</strong> {selectedLog.location || 'Unknown'}</p>
                </div>
                <div className="space-y-1">
                  <p><strong>Target Entity:</strong> {selectedLog.entityType || 'None'} (ID: {selectedLog.entityId || 'N/A'})</p>
                  <p><strong>Timestamp:</strong> {new Date(selectedLog.createdAt).toLocaleString()}</p>
                  <p><strong>Session ID:</strong> {selectedLog.sessionId || 'N/A'}</p>
                </div>
              </div>

              {/* User Agent */}
              {selectedLog.userAgent && (
                <div className="bg-secondary/20 p-3 rounded-2xl text-xs font-mono text-muted-foreground flex gap-2 items-start">
                  <Terminal size={14} className="shrink-0 mt-0.5" />
                  <span className="break-all">{selectedLog.userAgent}</span>
                </div>
              )}

              {/* Details / Metadata */}
              {selectedLog.details && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-1 text-muted-foreground">Metadata</h3>
                  <pre className="bg-background border border-border/40 p-3 rounded-xl text-[10px] font-mono overflow-x-auto whitespace-pre-wrap max-h-40">
                    {selectedLog.details}
                  </pre>
                </div>
              )}

              {/* Diff View */}
              {(selectedLog.beforeValue || selectedLog.afterValue) && (
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider mb-2 text-muted-foreground">Before / After Diff</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-[10px] font-mono">
                    <div className="border border-red-200/60 bg-red-500/5 p-3 rounded-xl">
                      <div className="text-red-500 font-bold uppercase text-[9px] mb-1.5">Previous Value</div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.beforeValue, null, 2) || 'null'}
                      </pre>
                    </div>
                    <div className="border border-emerald-200/60 bg-emerald-500/5 p-3 rounded-xl">
                      <div className="text-emerald-600 font-bold uppercase text-[9px] mb-1.5">New Value</div>
                      <pre className="overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.afterValue, null, 2) || 'null'}
                      </pre>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex mt-6">
              <button
                onClick={() => setSelectedLog(null)}
                className="w-full py-2.5 bg-secondary hover:bg-secondary/80 rounded-xl text-sm font-semibold transition"
              >
                Close Details
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
