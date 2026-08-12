'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Tv, Plus, Calendar, ExternalLink, RefreshCw, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

interface LiveEvent {
  id: number;
  title: string;
  description: string;
  status: 'scheduled' | 'live' | 'ended';
  scheduledStartTime: string;
  scheduledEndTime: string;
  streamKey?: string;
  playbackUrl?: string;
}

export default function AdminLiveShoppingPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [events, setEvents] = useState<LiveEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState({
    title: '',
    description: '',
    scheduledStartTime: '',
    scheduledEndTime: '',
  });

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const res = await api.get('/live-shopping');
      setEvents(res.data);
    } catch {
      toast.error('Failed to load live shopping events');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await api.post('/live-shopping', {
        ...form,
        scheduledStartTime: new Date(form.scheduledStartTime).toISOString(),
        scheduledEndTime: new Date(form.scheduledEndTime).toISOString(),
      });
      toast.success('Live event scheduled successfully!');
      setShowModal(false);
      setForm({ title: '', description: '', scheduledStartTime: '', scheduledEndTime: '' });
      fetchEvents();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to schedule event');
    }
  };

  const handleDelete = async (eventId: number) => {
    if (!confirm('Are you sure you want to delete this livestream event?')) return;
    try {
      await api.delete(`/live-shopping/${eventId}`);
      toast.success('Livestream deleted');
      fetchEvents();
    } catch {
      toast.error('Failed to delete live event');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground">Live Shopping</h1>
            <p className="text-xs text-muted-foreground">Manage and broadcast real-time interactive streams</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="px-5 py-2.5 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/95 transition flex items-center gap-1.5 cursor-pointer shadow-md shadow-primary/20"
          >
            <Plus size={16} />
            <span>Schedule Stream</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12 text-muted-foreground flex justify-center items-center gap-2">
            <RefreshCw className="w-5 h-5 animate-spin text-primary" />
            <span>Loading streams queue...</span>
          </div>
        ) : events.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-16 text-center space-y-4 shadow-sm">
            <Tv size={48} className="mx-auto text-muted-foreground/35" />
            <div>
              <h3 className="font-bold text-foreground text-lg">No livestreams scheduled</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Go ahead and schedule your first interactive live shopping event!
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop View */}
            <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-secondary/35 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                    <th className="px-6 py-4">Title</th>
                    <th className="px-6 py-4">Scheduled Start</th>
                    <th className="px-6 py-4">Scheduled End</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30 text-sm">
                  {events.map((event) => (
                    <tr key={event.id} className="hover:bg-secondary/20 transition-all duration-200">
                      <td className="px-6 py-4">
                        <div className="font-semibold text-foreground">{event.title}</div>
                        <div className="text-xs text-muted-foreground max-w-sm truncate">{event.description}</div>
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
                        {new Date(event.scheduledStartTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4 text-xs font-semibold text-muted-foreground">
                        {new Date(event.scheduledEndTime).toLocaleString()}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          event.status === 'live' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                          event.status === 'ended' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                          'bg-blue-500/10 text-blue-600 border-blue-500/20'
                        }`}>
                          {event.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-3">
                          <Link
                            href={`/${locale}/admin/live-shopping/${event.id}`}
                            className="px-3.5 py-1.5 bg-primary/10 hover:bg-primary/20 text-primary font-bold rounded-xl text-xs flex items-center gap-1 transition"
                          >
                            <ExternalLink size={14} />
                            <span>Control Room</span>
                          </Link>
                          <button
                            onClick={() => handleDelete(event.id)}
                            className="p-2 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition cursor-pointer"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {events.map((event) => (
                <div key={event.id} className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm space-y-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-base text-foreground">{event.title}</h4>
                      <p className="text-xs text-muted-foreground line-clamp-1">{event.description}</p>
                    </div>
                    <span className={`px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
                      event.status === 'live' ? 'bg-red-500/10 text-red-600 border-red-500/20' :
                      event.status === 'ended' ? 'bg-gray-100 text-gray-500 border-gray-200' :
                      'bg-blue-500/10 text-blue-600 border-blue-500/20'
                    }`}>
                      {event.status}
                    </span>
                  </div>

                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>Start:</span>
                      <span className="font-medium text-foreground">{new Date(event.scheduledStartTime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center text-muted-foreground">
                      <span>End:</span>
                      <span className="font-medium text-foreground">{new Date(event.scheduledEndTime).toLocaleString()}</span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                    <Link
                      href={`/${locale}/admin/live-shopping/${event.id}`}
                      className="px-4 py-2 bg-primary text-white font-bold rounded-xl text-xs flex items-center gap-1 transition shadow-sm"
                    >
                      <ExternalLink size={14} />
                      <span>Control Room</span>
                    </Link>
                    <button
                      onClick={() => handleDelete(event.id)}
                      className="p-2 border border-border text-red-500 hover:bg-red-50 rounded-xl cursor-pointer"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Schedule Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl shadow-xl max-w-md w-full p-6 animate-in fade-in zoom-in duration-200 border border-border/50">
            <h2 className="text-2xl font-playfair font-bold mb-4 text-foreground">Schedule Livestream</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="Summer Makeup Glow"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Description</label>
                <textarea
                  required
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full p-3 rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm h-24 resize-none"
                  placeholder="Join our stream to check out new products and grab exclusive live discounts!"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Start Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledStartTime}
                    onChange={(e) => setForm({ ...form, scheduledStartTime: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-input bg-background focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">End Time</label>
                  <input
                    type="datetime-local"
                    required
                    value={form.scheduledEndTime}
                    onChange={(e) => setForm({ ...form, scheduledEndTime: e.target.value })}
                    className="w-full p-3 rounded-2xl border border-input bg-background focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white text-xs font-bold rounded-full hover:bg-primary/90 transition cursor-pointer shadow-md shadow-primary/20"
                >
                  Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
