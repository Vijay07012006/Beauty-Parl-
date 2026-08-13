'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { ArrowLeft, Download, User, Mail, Phone, Shield, Calendar, Award, DollarSign, ShoppingBag, UserX, UserCheck } from 'lucide-react';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

export default function UserDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';
  const userId = params?.id;
  const { user: me } = useAuthStore();
  const isSuperAdmin = me?.role === 'super_admin';

  const [data, setData] = useState<{ user: any; orders: any[]; totalSpent: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    api.get(`/admin/users/${userId}/details`)
      .then(res => setData(res.data))
      .catch(() => toast.error('Failed to load user details'))
      .finally(() => setLoading(false));
  }, [userId]);

  const handleSuspend = async () => {
    if (!data?.user || !confirm(`Suspend ${data.user.name}?`)) return;
    try {
      await api.put(`/admin/users/${userId}/suspend`, { reason: 'Admin action', duration: '7d' });
      toast.success('User suspended');
      router.refresh();
    } catch { toast.error('Failed to suspend'); }
  };

  const handleReactivate = async () => {
    if (!data?.user) return;
    try {
      await api.put(`/admin/users/${userId}/reactivate`);
      toast.success('User reactivated');
      router.refresh();
    } catch { toast.error('Failed to reactivate'); }
  };

  const handleExportPDF = async () => {
    const el = document.getElementById('user-detail-card');
    if (!el) return;
    toast.loading('Generating PDF...');
    try {
      const canvas = await html2canvas(el, { scale: 2, backgroundColor: '#ffffff' });
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;
      pdf.addImage(canvas.toDataURL('image/png'), 'PNG', 0, 0, imgW, imgH);
      pdf.save(`user_${data?.user?.name?.replace(/\s+/g, '_')}.pdf`);
      toast.dismiss();
      toast.success('PDF exported!');
    } catch { toast.dismiss(); toast.error('Export failed'); }
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  if (!data) {
    return (
      <AdminLayout>
        <div className="text-center py-20 text-muted-foreground">User not found</div>
      </AdminLayout>
    );
  }

  const { user: u, orders, totalSpent } = data;

  return (
    <AdminLayout>
      <div className="space-y-6 max-w-4xl">
        {/* Top bar */}
        <div className="flex items-center justify-between gap-4">
          <button
            onClick={() => router.push(`/${locale}/admin/users`)}
            className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition"
          >
            <ArrowLeft size={16} />
            Back to Users
          </button>
          <div className="flex items-center gap-2">
            {isSuperAdmin && (
              <>
                {u.isActive ? (
                  <button
                    onClick={handleSuspend}
                    className="flex items-center gap-1.5 px-4 py-2 bg-amber-500 text-white rounded-xl text-sm font-medium hover:bg-amber-600 transition"
                  >
                    <UserX size={15} /> Suspend
                  </button>
                ) : (
                  <button
                    onClick={handleReactivate}
                    className="flex items-center gap-1.5 px-4 py-2 bg-emerald-500 text-white rounded-xl text-sm font-medium hover:bg-emerald-600 transition"
                  >
                    <UserCheck size={15} /> Reactivate
                  </button>
                )}
              </>
            )}
            <button
              onClick={handleExportPDF}
              className="flex items-center gap-1.5 px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition shadow-sm"
            >
              <Download size={15} /> Export PDF
            </button>
          </div>
        </div>

        {/* Profile card */}
        <div id="user-detail-card" className="bg-card border border-border/40 rounded-3xl p-6 space-y-6">
          {/* Profile header */}
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary flex items-center justify-center text-2xl font-bold text-white">
              {u.name?.charAt(0)?.toUpperCase()}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold">{u.name}</h1>
                <span className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                  u.isActive
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-red-100 text-red-600'
                }`}>
                  {u.isActive ? 'Active' : 'Suspended'}
                </span>
              </div>
              <p className="text-muted-foreground text-sm mt-0.5">{u.email}</p>
              <span className={`inline-block mt-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                u.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                u.role === 'admin' ? 'bg-blue-100 text-blue-700' :
                'bg-secondary text-muted-foreground'
              }`}>
                {u.role?.replace('_', ' ')}
              </span>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Calendar, label: 'Joined', value: new Date(u.createdAt).toLocaleDateString() },
              { icon: Award, label: 'Loyalty Tier', value: u.loyaltyTier || 'Silver' },
              { icon: DollarSign, label: 'Total Spent', value: `₹${Number(totalSpent || 0).toFixed(2)}` },
              { icon: ShoppingBag, label: 'Orders', value: orders.length },
            ].map(item => (
              <div key={item.label} className="bg-secondary/20 rounded-2xl p-4 flex flex-col gap-2">
                <item.icon size={18} className="text-primary" />
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{item.label}</p>
                <p className="text-lg font-bold">{item.value}</p>
              </div>
            ))}
          </div>

          {/* Recent Orders */}
          {orders.length > 0 && (
            <div>
              <h3 className="text-sm font-bold mb-3 text-muted-foreground uppercase tracking-wider">Recent Orders</h3>
              <div className="space-y-2">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="flex items-center justify-between p-3 bg-secondary/20 rounded-xl text-sm">
                    <div className="flex items-center gap-3">
                      <span className="font-mono text-xs text-muted-foreground">#{order.id}</span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        order.status === 'delivered' ? 'bg-emerald-100 text-emerald-700' :
                        order.status === 'cancelled' ? 'bg-red-100 text-red-600' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">₹{Number(order.total).toFixed(2)}</p>
                      <p className="text-[10px] text-muted-foreground">{new Date(order.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
