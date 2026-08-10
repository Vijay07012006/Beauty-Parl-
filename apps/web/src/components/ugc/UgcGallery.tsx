'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Camera, Check, X, Shield } from 'lucide-react';

interface UgcPhoto {
  id: number;
  imageUrl: string;
  caption?: string;
  createdAt: string;
  user?: { name: string };
  product?: { name: string };
}

interface UgcGalleryProps {
  productId: number;
}

export function UgcGallery({ productId }: UgcGalleryProps) {
  const { user, token } = useAuthStore();
  const [photos, setPhotos] = useState<UgcPhoto[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [imageUrl, setImageUrl] = useState('');
  const [caption, setCaption] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const [pendingPhotos, setPendingPhotos] = useState<UgcPhoto[]>([]);
  const [loadingAdmin, setLoadingAdmin] = useState(false);

  const isAdmin = user?.role === 'admin';

  const fetchPhotos = async () => {
    try {
      const res = await api.get(`/ugc/product/${productId}`);
      setPhotos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load UGC:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingPhotos = async () => {
    if (!isAdmin) return;
    setLoadingAdmin(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      const res = await api.get('/ugc/admin/pending', { headers });
      setPendingPhotos(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Failed to load pending UGC:', err);
    } finally {
      setLoadingAdmin(false);
    }
  };

  useEffect(() => {
    fetchPhotos();
    if (isAdmin) {
      fetchPendingPhotos();
    }
  }, [productId, user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      toast.error('Please specify a photo URL');
      return;
    }

    setSubmitting(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await api.post('/ugc', { productId, imageUrl, caption }, { headers });
      toast.success('UGC submitted! It will appear in the gallery after admin review. 🌸');
      setImageUrl('');
      setCaption('');
      setShowForm(false);
    } catch (err: any) {
      toast.error('Failed to upload UGC photo');
    } finally {
      setSubmitting(false);
    }
  };

  const handleApprove = async (id: number) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await api.put(`/ugc/admin/approve/${id}`, {}, { headers });
      toast.success('Photo approved!');
      fetchPendingPhotos();
      fetchPhotos();
    } catch {
      toast.error('Approve action failed');
    }
  };

  const handleReject = async (id: number) => {
    try {
      const headers = { Authorization: `Bearer ${token}` };
      await api.delete(`/ugc/admin/reject/${id}`, { headers });
      toast.success('Photo rejected/deleted');
      fetchPendingPhotos();
    } catch {
      toast.error('Reject action failed');
    }
  };

  const useSamplePhoto = () => {
    const samples = [
      'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&q=80&w=400',
      'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&q=80&w=400',
    ];
    setImageUrl(samples[Math.floor(Math.random() * samples.length)]);
  };

  return (
    <div className="space-y-8 py-8 border-t border-border/40">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-playfair font-bold text-foreground">Customer Lookbook</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Real looks uploaded by our community using this product.</p>
        </div>
        {user && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-1.5 px-4 py-2 bg-primary/10 text-primary hover:bg-primary hover:text-white rounded-full transition text-xs font-bold cursor-pointer"
          >
            <Camera className="w-4 h-4" /> Upload Look
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="p-4 bg-secondary/10 border border-border/20 rounded-2xl space-y-4 max-w-md">
          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Photo URL</label>
            <div className="flex gap-2">
              <input
                type="url"
                placeholder="Paste photo URL (HTTPS)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-card border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={useSamplePhoto}
                className="px-3 py-2 border border-border rounded-xl text-xs hover:bg-secondary/40 font-semibold cursor-pointer"
              >
                Sample
              </button>
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Caption / Style Tips</label>
            <textarea
              placeholder="e.g. Wore this lipstick with my favorite makeup look!"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              className="w-full bg-card border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none h-16 resize-none"
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2 bg-neutral-900 text-white font-bold rounded-xl text-xs hover:bg-neutral-850 transition cursor-pointer"
          >
            {submitting ? 'Uploading...' : 'Submit Photo for Review'}
          </button>
        </form>
      )}

      {loading ? (
        <div className="text-center text-xs text-muted-foreground animate-pulse">Loading gallery looks...</div>
      ) : photos.length === 0 ? (
        <div className="text-center py-8 bg-secondary/5 border border-dashed border-border/30 rounded-3xl text-xs text-muted-foreground">
          No customer photos yet. Be the first to share your look!
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {photos.map((photo) => (
            <div key={photo.id} className="group relative aspect-square rounded-2xl overflow-hidden bg-secondary/20 border border-border/30 shadow-sm">
              <img src={photo.imageUrl} alt={photo.caption || 'Look'} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3 text-white">
                {photo.caption && <p className="text-[10px] font-medium leading-relaxed line-clamp-2">{photo.caption}</p>}
                <span className="text-[9px] font-bold opacity-80 mt-1">By: {photo.user?.name || 'Customer'}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {isAdmin && pendingPhotos.length > 0 && (
        <div className="p-5 bg-card/40 border border-red-200/50 rounded-3xl space-y-4">
          <div className="flex items-center gap-1.5 text-xs font-bold text-red-600 uppercase tracking-wider">
            <Shield className="w-4 h-4" /> Admin Mod Gallery Queue ({pendingPhotos.length})
          </div>

          {loadingAdmin ? (
            <div className="text-xs text-muted-foreground animate-pulse">Loading pending approval queue...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {pendingPhotos.map((photo) => (
                <div key={photo.id} className="relative aspect-square rounded-2xl overflow-hidden bg-secondary/15 border border-border flex flex-col justify-between">
                  <img src={photo.imageUrl} alt="Pending Mod" className="w-full h-2/3 object-cover" />
                  <div className="p-2 space-y-1 bg-card h-1/3 flex flex-col justify-between border-t border-border/20">
                    <span className="text-[9px] text-muted-foreground line-clamp-1">{photo.caption || 'No caption'}</span>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleApprove(photo.id)}
                        className="p-1 bg-green-500 hover:bg-green-600 text-white rounded transition cursor-pointer"
                        title="Approve Look"
                      >
                        <Check className="w-3 h-3" />
                      </button>
                      <button
                        onClick={() => handleReject(photo.id)}
                        className="p-1 bg-red-500 hover:bg-red-600 text-white rounded transition cursor-pointer"
                        title="Reject / Delete Look"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
