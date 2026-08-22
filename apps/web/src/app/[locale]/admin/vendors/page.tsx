'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Check, X, ShieldAlert, Award, FileText } from 'lucide-react';

interface Vendor {
  id: number;
  userId: number;
  storeName: string;
  businessRegNumber: string;
  commissionRate: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
}

export default function AdminVendorsPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchVendors = async () => {
    try {
      const res = await api.get('/admin/vendors');
      setVendors(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error('Failed to retrieve vendor registry');
    }
  };

  useEffect(() => {
    if (!user || (user.role !== 'admin' && user.role !== 'super_admin')) {
      toast.error('Administrative clearance required.');
      router.push(`/${locale}/auth/login`);
      return;
    }

    async function init() {
      await fetchVendors();
      setLoading(false);
    }
    init();
  }, [user]);

  const handleUpdateStatus = async (vendorId: number, status: 'approved' | 'rejected') => {
    try {
      await api.post(`/admin/vendors/${vendorId}/approve`, { status });
      toast.success(`Vendor application successfully updated to ${status}!`);
      await fetchVendors();
    } catch {
      toast.error('Failed to update vendor application status');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Loading vendor registry...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow container mx-auto px-4 py-12 max-w-6xl space-y-10">
        <div className="bg-gradient-to-r from-primary/10 to-accent/5 p-8 rounded-3xl border border-zinc-800/80">
          <h1 className="text-3xl font-bold font-playfair tracking-tight">🏢 Vendor Approvals Panel</h1>
          <p className="text-xs text-zinc-400 mt-1">
            Review and approve third-party brands and business partner applications.
          </p>
        </div>

        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-3xl p-6 shadow-xl space-y-6 backdrop-blur">
          <h3 className="text-lg font-bold font-playfair border-b border-zinc-800 pb-3 flex items-center gap-2">
            <FileText size={18} className="text-primary" /> Registry Applications ({vendors.length})
          </h3>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-zinc-800 text-zinc-400 font-semibold uppercase tracking-wider">
                  <th className="py-3 px-4">Store Name</th>
                  <th className="py-3 px-4">Owner Email</th>
                  <th className="py-3 px-4">Registry Number</th>
                  <th className="py-3 px-4">Commission (%)</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-850">
                {vendors.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-zinc-500 italic">
                      No vendor partner applications recorded.
                    </td>
                  </tr>
                ) : (
                  vendors.map((v) => (
                    <tr key={v.id} className="hover:bg-zinc-950/40 transition-colors">
                      <td className="py-4 px-4 font-bold text-zinc-200">{v.storeName}</td>
                      <td className="py-4 px-4 text-zinc-400 font-mono">{v.user?.email || `User #${v.userId}`}</td>
                      <td className="py-4 px-4 text-zinc-400 font-mono">{v.businessRegNumber}</td>
                      <td className="py-4 px-4 text-zinc-400 font-mono">{v.commissionRate}%</td>
                      <td className="py-4 px-4">
                        <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border ${
                          v.status === 'approved'
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-500'
                            : v.status === 'rejected'
                            ? 'bg-rose-500/10 border-rose-500/20 text-rose-500'
                            : 'bg-yellow-500/10 border-yellow-500/20 text-yellow-500'
                        }`}>
                          {v.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-right">
                        {v.status === 'pending' && (
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleUpdateStatus(v.id, 'approved')}
                              className="p-1.5 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-500 rounded-full transition cursor-pointer"
                              title="Approve Partner"
                            >
                              <Check size={14} />
                            </button>
                            <button
                              onClick={() => handleUpdateStatus(v.id, 'rejected')}
                              className="p-1.5 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-500 rounded-full transition cursor-pointer"
                              title="Reject Partner"
                            >
                              <X size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
