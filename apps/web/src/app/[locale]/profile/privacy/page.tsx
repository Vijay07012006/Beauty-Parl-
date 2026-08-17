'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ShieldCheck, Download, Trash2, XCircle, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

interface GdprStatus {
  hasPendingDeletion: boolean;
  deletionRequest?: {
    id: number;
    email: string;
    status: string;
    requestedAt: string;
  } | null;
}

export default function PrivacyPage() {
  const { token, hydrate } = useAuthStore();
  const [status, setStatus] = useState<GdprStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [exportLoading, setExportLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<'json' | 'csv'>('json');

  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';

  useEffect(() => {
    hydrate();
  }, []);

  const fetchStatus = async () => {
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/gdpr/status', { withCredentials: true });
      setStatus(response.data);
    } catch (error) {
      console.error('Failed to fetch GDPR status:', error);
    } finally {
      setStatus(prev => prev);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, [token]);

  const handleExportData = async () => {
    setExportLoading(true);
    try {
      const response = await api.post('/gdpr/export', {}, { withCredentials: true });
      if (response.data?.success && response.data?.token) {
        toast.success('Preparing data download...');
        const downloadUrl = `${api.defaults.baseURL}/gdpr/export/${response.data.token}?format=${exportFormat}`;
        window.open(downloadUrl, '_blank');
      }
    } catch (error) {
      console.error('Data export failed:', error);
      toast.error('Failed to generate data export');
    } finally {
      setExportLoading(false);
    }
  };

  const handleDeleteRequest = async () => {
    if (!confirm('Are you absolutely sure you want to request account deletion? Your data will be permanently deleted after 30 days.')) {
      return;
    }
    setDeleteLoading(true);
    try {
      await api.post('/gdpr/delete', {}, { withCredentials: true });
      toast.success('Account deletion requested. You have 30 days to cancel this request.');
      await fetchStatus();
    } catch (error: any) {
      console.error('Account deletion request failed:', error);
      toast.error(error.response?.data?.message || 'Failed to request deletion');
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleCancelDelete = async () => {
    setDeleteLoading(true);
    try {
      await api.post('/gdpr/delete/cancel', {}, { withCredentials: true });
      toast.success('Account deletion request cancelled successfully.');
      await fetchStatus();
    } catch (error) {
      console.error('Cancellation failed:', error);
      toast.error('Failed to cancel deletion request');
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/10 to-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-6 font-medium">
          <Link href={`/${locale}/profile`} className="hover:text-primary transition-colors">Profile</Link>
          <span>/</span>
          <span className="text-foreground">Privacy & GDPR</span>
        </div>

        {/* Header */}
        <div className="p-6 rounded-3xl border border-border/40 bg-card/65 backdrop-blur-md shadow-xl mb-8">
          <div className="space-y-1">
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <ShieldCheck size={22} className="text-primary" /> Privacy Settings
            </h1>
            <p className="text-xs text-muted-foreground">
              Manage your personal data in compliance with GDPR regulations.
            </p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-4">
            <div className="h-44 bg-card/50 border border-border/40 animate-pulse rounded-3xl" />
            <div className="h-44 bg-card/50 border border-border/40 animate-pulse rounded-3xl" />
          </div>
        ) : (
          <div className="space-y-6">
            
            {/* Pending Deletion Warning Banner */}
            {status?.hasPendingDeletion && (
              <div className="p-5 border border-red-500/20 bg-red-500/10 rounded-3xl flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-pulse animate-duration-1000">
                <div className="flex gap-3">
                  <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
                  <div>
                    <h4 className="text-sm font-bold text-red-500">Account Scheduled for Deletion</h4>
                    <p className="text-xs text-muted-foreground">
                      Requested on: {new Date(status.deletionRequest?.requestedAt || '').toLocaleDateString()}. Your account will be permanently deleted after 30 days.
                    </p>
                  </div>
                </div>
                <button
                  onClick={handleCancelDelete}
                  disabled={deleteLoading}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full text-xs font-bold transition shadow-sm cursor-pointer select-none disabled:opacity-50"
                >
                  {deleteLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <XCircle size={14} />
                  )}
                  Cancel Deletion Request
                </button>
              </div>
            )}

            {/* Data Portability (GDPR Export) */}
            <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm">
              <div className="flex items-start gap-4 mb-4">
                <div className="p-3 bg-primary/10 rounded-2xl">
                  <Download className="text-primary w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-foreground">Export My Personal Data</h3>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Download a comprehensive copy of your profile info, orders, addresses, wishlist, reviews, and support history.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 mt-6 pt-4 border-t border-border/40">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Format Option</label>
                  <select
                    value={exportFormat}
                    onChange={(e) => setExportFormat(e.target.value as 'json' | 'csv')}
                    className="px-3 py-1.5 text-xs border border-border/60 rounded-xl bg-background focus:outline-none cursor-pointer"
                  >
                    <option value="json">JSON format</option>
                    <option value="csv">CSV format</option>
                  </select>
                </div>
                
                <button
                  onClick={handleExportData}
                  disabled={exportLoading}
                  className="self-end flex items-center gap-2 px-5 py-2 bg-primary hover:bg-primary/95 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                >
                  {exportLoading ? (
                    <Loader2 size={12} className="animate-spin" />
                  ) : (
                    <Download size={14} />
                  )}
                  Request Download
                </button>
              </div>
            </div>

            {/* Account Deletion Request */}
            {!status?.hasPendingDeletion && (
              <div className="p-6 bg-card border border-border/40 rounded-3xl shadow-sm">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-red-500/10 rounded-2xl">
                    <Trash2 className="text-red-500 w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-foreground">Delete Account</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Request the permanent deletion of your account and personal data. A 30-day grace period is provided during which you can cancel your request.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-6 pt-4 border-t border-border/40">
                  <button
                    onClick={handleDeleteRequest}
                    disabled={deleteLoading}
                    className="flex items-center gap-2 px-5 py-2 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                  >
                    {deleteLoading ? (
                      <Loader2 size={12} className="animate-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}
                    Request Account Deletion
                  </button>
                </div>
              </div>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
