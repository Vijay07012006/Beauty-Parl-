'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Check, X, Shield, Image as ImageIcon, Camera, Trash } from 'lucide-react';
import { toast } from 'sonner';

interface UgcPhoto {
  id: number;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  isApproved: boolean;
  user?: { name: string; email: string };
  product?: { name: string };
}

export default function AdminUgcPage() {
  const [pendingPhotos, setPendingPhotos] = useState<UgcPhoto[]>([]);
  const [approvedPhotos, setApprovedPhotos] = useState<UgcPhoto[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'pending' | 'approved'>('pending');

  useEffect(() => {
    fetchUgcData();
  }, []);

  const fetchUgcData = async () => {
    setLoading(true);
    try {
      // Auth is carried by the HttpOnly bp_token cookie sent via withCredentials
      // Fetch pending queue
      const pendingRes = await api.get('/ugc/admin/pending');
      setPendingPhotos(Array.isArray(pendingRes.data) ? pendingRes.data : []);

      // Fetch approved gallery
      const approvedRes = await api.get('/ugc/gallery');
      setApprovedPhotos(Array.isArray(approvedRes.data) ? approvedRes.data : []);
    } catch (err) {
      console.error('Failed to load UGC data:', err);
      toast.error('Failed to load UGC list');
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      await api.put(`/ugc/admin/approve/${id}`, {});
      toast.success('Photo approved for public lookbook!');
      fetchUgcData();
    } catch {
      toast.error('Approve action failed');
    }
  };

  const handleReject = async (id: number) => {
    if (!confirm('Are you sure you want to permanently delete/reject this photo?')) return;
    try {
      await api.delete(`/ugc/admin/reject/${id}`);
      toast.success('Photo rejected and removed.');
      fetchUgcData();
    } catch {
      toast.error('Reject action failed');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-playfair font-bold text-foreground">UGC Photos Moderation</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Manage and moderate customer-uploaded lookbook pictures.</p>
        </div>

        {/* Tab Selectors */}
        <div className="flex border-b border-border/50">
          <button
            onClick={() => setActiveTab('pending')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition cursor-pointer select-none ${
              activeTab === 'pending'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Pending Review ({pendingPhotos.length})
          </button>
          <button
            onClick={() => setActiveTab('approved')}
            className={`px-6 py-3 text-sm font-semibold border-b-2 transition cursor-pointer select-none ${
              activeTab === 'approved'
                ? 'border-primary text-primary font-bold'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            Approved Gallery ({approvedPhotos.length})
          </button>
        </div>

        {loading ? (
          <div className="p-12 text-center text-muted-foreground animate-pulse text-sm">
            Loading UGC photos list...
          </div>
        ) : (
          <>
            {activeTab === 'pending' ? (
              pendingPhotos.length === 0 ? (
                <div className="p-12 text-center text-muted-foreground bg-card border border-dashed border-border/40 rounded-3xl text-sm">
                  The moderation queue is empty. There are no pending looks to review. ✨
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  {pendingPhotos.map((photo) => (
                    <div key={photo.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between">
                      <div className="relative aspect-square w-full bg-secondary/10">
                        <img
                          src={photo.imageUrl}
                          alt="Pending look"
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                        <div className="space-y-1">
                          {photo.product?.name && (
                            <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                              {photo.product.name}
                            </span>
                          )}
                          <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                            {photo.caption || 'No caption provided.'}
                          </p>
                          <div className="text-[10px] text-muted-foreground pt-1">
                            Uploaded by: <span className="font-semibold">{photo.user?.name || 'Customer'}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 pt-2 border-t border-border/20">
                          <button
                            onClick={() => handleApprove(photo.id)}
                            className="flex-1 py-2 bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl text-xs font-bold transition cursor-pointer flex items-center justify-center gap-1"
                          >
                            <Check className="w-3.5 h-3.5" /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(photo.id)}
                            className="p-2 bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white rounded-xl transition cursor-pointer"
                            title="Reject/Delete Look"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )
            ) : approvedPhotos.length === 0 ? (
              <div className="p-12 text-center text-muted-foreground bg-card border border-dashed border-border/40 rounded-3xl text-sm">
                No approved lookbook photos exist yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {approvedPhotos.map((photo) => (
                  <div key={photo.id} className="bg-card border border-border/50 rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition flex flex-col justify-between group">
                    <div className="relative aspect-square w-full bg-secondary/10 overflow-hidden">
                      <img
                        src={photo.imageUrl}
                        alt="Approved look"
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                      />
                    </div>
                    <div className="p-4 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        {photo.product?.name && (
                          <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full uppercase">
                            {photo.product.name}
                          </span>
                        )}
                        <p className="text-xs text-muted-foreground line-clamp-2 mt-1.5 leading-relaxed">
                          {photo.caption || 'No caption.'}
                        </p>
                        <div className="text-[10px] text-muted-foreground pt-1">
                          By: <span className="font-semibold">{photo.user?.name || 'Customer'}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2 border-t border-border/20 text-xs">
                        <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-600">
                          Approved
                        </span>
                        <button
                          onClick={() => handleReject(photo.id)}
                          className="p-1.5 text-rose-500 bg-rose-500/10 hover:bg-rose-500 hover:text-white rounded-lg transition cursor-pointer"
                          title="Delete Look"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </AdminLayout>
  );
}
