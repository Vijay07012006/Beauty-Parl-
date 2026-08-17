'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { AlertOctagon, CheckCircle2, ShieldAlert, XCircle, Clock, RefreshCw, Eye } from 'lucide-react';

interface FraudAlert {
  id: number;
  orderId: number;
  userId?: number;
  reason: string;
  confidenceScore: number;
  status: 'pending' | 'reviewed' | 'false_positive' | 'confirmed';
  createdAt: string;
  order?: {
    id: number;
    total: string;
    status: string;
    guestEmail?: string;
  };
  user?: {
    id: number;
    email: string;
    name: string;
  };
}

export default function FraudDashboard() {
  const [alerts, setAlerts] = useState<FraudAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedAlert, setSelectedAlert] = useState<FraudAlert | null>(null);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  const fetchAlerts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/fraud', { withCredentials: true });
      setAlerts(res.data || []);
    } catch {
      toast.error('Failed to load fraud alerts');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAlerts();
  }, []);

  const handleReview = async (id: number, status: 'confirmed' | 'false_positive') => {
    setActionLoading(id);
    try {
      await api.put(`/admin/fraud/${id}/review`, { status }, { withCredentials: true });
      toast.success(status === 'confirmed' ? 'Fraud confirmed. Order cancelled.' : 'Alert dismissed.');
      fetchAlerts();
      if (selectedAlert?.id === id) {
        setSelectedAlert(null);
      }
    } catch {
      toast.error('Failed to update alert status');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <span className="px-2 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-[10px] font-bold">CONFIRMED</span>;
      case 'false_positive':
        return <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 rounded-full text-[10px] font-bold">DISMISSED</span>;
      default:
        return <span className="px-2 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300 rounded-full text-[10px] font-bold animate-pulse">PENDING</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
              <ShieldAlert className="text-red-500" size={24} /> AI Fraud Control
            </h1>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor, review, and auto-reject high-risk suspicious orders</p>
          </div>
          <button
            onClick={fetchAlerts}
            className="flex items-center gap-2 p-2 border border-border/60 rounded-xl hover:bg-secondary/40 transition"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>

        {/* Alerts Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="bg-card border border-border/40 rounded-2xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/40 bg-secondary/20 text-xs text-muted-foreground">
                    <th className="px-5 py-3 text-left font-semibold uppercase">Alert ID</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase">Order ID</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase">Customer</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase">Risk Score</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase">Status</th>
                    <th className="px-5 py-3 text-left font-semibold uppercase">Reason</th>
                    <th className="px-5 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {alerts.map(alert => (
                    <tr key={alert.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs">#{alert.id}</td>
                      <td className="px-5 py-3.5 font-bold">
                        #{alert.orderId}
                        {alert.order && (
                          <span className="block text-[10px] text-muted-foreground">
                            Total: ${parseFloat(alert.order.total).toFixed(2)}
                          </span>
                        )}
                      </td>
                      <td className="px-5 py-3.5 text-xs">
                        <span className="block font-semibold">
                          {alert.user?.email || alert.order?.guestEmail || 'Guest'}
                        </span>
                        {alert.userId && <span className="text-[10px] text-muted-foreground">User ID: {alert.userId}</span>}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1.5">
                          <div className="w-12 bg-secondary h-1.5 rounded-full overflow-hidden">
                            <div 
                              className={`h-full ${alert.confidenceScore > 75 ? 'bg-red-500' : 'bg-amber-500'}`} 
                              style={{ width: `${alert.confidenceScore}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold">{alert.confidenceScore}%</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-xs">{getStatusBadge(alert.status)}</td>
                      <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-xs truncate" title={alert.reason}>
                        {alert.reason}
                      </td>
                      <td className="px-5 py-3.5 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setSelectedAlert(alert)}
                            className="p-1.5 hover:bg-secondary rounded-lg text-primary transition"
                            title="View Detail"
                          >
                            <Eye size={14} />
                          </button>
                          {alert.status === 'pending' && (
                            <>
                              <button
                                onClick={() => handleReview(alert.id, 'false_positive')}
                                disabled={actionLoading !== null}
                                className="p-1.5 hover:bg-emerald-500/10 text-emerald-600 rounded-lg transition"
                                title="Dismiss (False Positive)"
                              >
                                <CheckCircle2 size={14} />
                              </button>
                              <button
                                onClick={() => handleReview(alert.id, 'confirmed')}
                                disabled={actionLoading !== null}
                                className="p-1.5 hover:bg-red-500/10 text-red-500 rounded-lg transition"
                                title="Confirm Fraud (Cancel Order)"
                              >
                                <XCircle size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {alerts.length === 0 && (
                <div className="text-center py-16 text-muted-foreground">
                  <AlertOctagon size={36} className="mx-auto mb-3 opacity-20" />
                  <p className="text-sm">No fraud alerts to review</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Alert Detail Modal */}
      {selectedAlert && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Fraud Alert Details</h2>
            <p className="text-xs text-muted-foreground mb-4">Alert #{selectedAlert.id} | Order #{selectedAlert.orderId}</p>

            <div className="space-y-4">
              <div className="p-3 bg-secondary/15 rounded-2xl text-xs space-y-1">
                <p><strong>Customer:</strong> {selectedAlert.user?.name || 'Guest'} ({selectedAlert.user?.email || selectedAlert.order?.guestEmail})</p>
                <p><strong>Risk Score:</strong> {selectedAlert.confidenceScore}%</p>
                <p><strong>Status:</strong> <span className="uppercase font-semibold">{selectedAlert.status}</span></p>
                <p><strong>Triggered At:</strong> {new Date(selectedAlert.createdAt).toLocaleString()}</p>
              </div>

              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider mb-1.5 text-muted-foreground">Flagged Reasons</h3>
                <div className="bg-secondary/10 border border-border/40 p-3 rounded-xl text-xs text-foreground space-y-1 max-h-40 overflow-y-auto">
                  {selectedAlert.reason.split(';').map((r, i) => (
                    <div key={i} className="flex gap-2 items-start">
                      <span className="text-red-500 mt-0.5">•</span>
                      <span>{r.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="flex gap-3 mt-6 pt-4 border-t border-border/40">
              <button
                onClick={() => setSelectedAlert(null)}
                className="flex-1 py-2 bg-secondary hover:bg-secondary/80 rounded-xl text-xs font-bold transition"
              >
                Close
              </button>
              {selectedAlert.status === 'pending' && (
                <>
                  <button
                    onClick={() => handleReview(selectedAlert.id, 'false_positive')}
                    className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleReview(selectedAlert.id, 'confirmed')}
                    className="flex-1 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition"
                  >
                    Confirm Fraud
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
