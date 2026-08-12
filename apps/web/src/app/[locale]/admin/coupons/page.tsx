'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Plus, Edit, Trash2, Copy, Check, Ticket, Star, Calendar, Percent, ShieldCheck } from 'lucide-react';
import { toast } from 'sonner';

interface Coupon {
  id: number;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrder: number;
  maxDiscount: number | null;
  expiresAt: string | null;
  usageLimit: number;
  usedCount: number;
  isActive: boolean;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ total: 0, active: 0, used: 0 });
  const [showModal, setShowModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
  
  const [form, setForm] = useState({
    code: '',
    type: 'percentage',
    value: '',
    minOrder: '',
    maxDiscount: '',
    expiresAt: '',
    usageLimit: '',
  });

  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchCoupons();
    fetchStats();
  }, []);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const response = await api.get('/coupons/admin');
      setCoupons(response.data.coupons || []);
    } catch (error) {
      console.error('Failed to fetch coupons:', error);
      toast.error('Failed to load coupons list');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/coupons/admin/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const payload = {
        code: form.code.trim().toUpperCase(),
        type: form.type,
        value: parseFloat(form.value),
        minOrder: form.minOrder ? parseFloat(form.minOrder) : 0,
        maxDiscount: form.maxDiscount ? parseFloat(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? parseInt(form.usageLimit, 10) : 0,
        expiresAt: form.expiresAt ? new Date(form.expiresAt).toISOString() : null,
      };

      if (editingCoupon) {
        await api.put(`/coupons/admin/${editingCoupon.id}`, payload);
        toast.success('Coupon updated successfully!');
      } else {
        await api.post('/coupons/admin', payload);
        toast.success('Coupon created successfully!');
      }
      fetchCoupons();
      fetchStats();
      setShowModal(false);
      setEditingCoupon(null);
      setForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', expiresAt: '', usageLimit: '' });
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to save coupon');
    }
  };

  const handleToggle = async (id: number) => {
    try {
      await api.put(`/coupons/admin/${id}/toggle`);
      toast.success('Coupon status updated!');
      fetchCoupons();
      fetchStats();
    } catch (error) {
      toast.error('Failed to toggle coupon status');
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this coupon?')) return;
    try {
      await api.delete(`/coupons/admin/${id}`);
      toast.success('Coupon deleted successfully!');
      fetchCoupons();
      fetchStats();
    } catch (error) {
      toast.error('Failed to delete coupon');
    }
  };

  const copyCode = (code: string, id: number) => {
    navigator.clipboard.writeText(code);
    setCopiedId(id);
    toast.success('Code copied to clipboard!');
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground">Promo Coupons</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage promo codes and checkout discounts</p>
          </div>
          <button
            onClick={() => {
              setEditingCoupon(null);
              setForm({ code: '', type: 'percentage', value: '', minOrder: '', maxDiscount: '', expiresAt: '', usageLimit: '' });
              setShowModal(true);
            }}
            className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/95 transition-all shadow-sm shadow-primary/20 cursor-pointer font-bold text-xs md:text-sm select-none"
          >
            <Plus size={16} />
            Create Coupon
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card p-5 rounded-2xl border border-border/50 flex items-center gap-4">
            <div className="p-3 bg-secondary/50 rounded-xl">
              <Ticket size={20} className="text-foreground" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Coupons</p>
              <p className="text-2xl font-bold text-foreground mt-0.5">{stats.total}</p>
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border/50 flex items-center gap-4">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Star size={20} className="fill-emerald-50 text-emerald-600" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Active Coupons</p>
              <p className="text-2xl font-bold text-emerald-600 mt-0.5">{stats.active}</p>
            </div>
          </div>
          <div className="bg-card p-5 rounded-2xl border border-border/50 flex items-center gap-4">
            <div className="p-3 bg-primary/10 text-primary rounded-xl">
              <ShieldCheck size={20} className="text-primary" />
            </div>
            <div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Total Redemptions</p>
              <p className="text-2xl font-bold text-primary mt-0.5">{stats.used}</p>
            </div>
          </div>
        </div>

        {/* Coupons Table */}
        {loading ? (
          <div className="bg-card rounded-2xl border border-border/50 p-12 text-center text-muted-foreground text-sm font-medium">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="bg-card rounded-2xl border border-border/50 p-16 text-center space-y-3">
            <Ticket size={48} className="mx-auto text-muted-foreground/30" />
            <div>
              <p className="font-bold text-foreground">No coupons created</p>
              <p className="text-xs text-muted-foreground mt-0.5">Create your first promo code to discount items</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Desktop Table View */}
            <div className="hidden md:block bg-card rounded-2xl border border-border/50 overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-secondary/35 border-b border-border/40 text-muted-foreground text-xs uppercase tracking-wider font-bold">
                      <th className="px-6 py-4">Code</th>
                      <th className="px-6 py-4">Type</th>
                      <th className="px-6 py-4">Value</th>
                      <th className="px-6 py-4">Redemptions</th>
                      <th className="px-6 py-4">Expiry Date</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/30 text-sm">
                    {coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-secondary/20 transition-all duration-200">
                        <td className="px-6 py-4 font-mono font-bold text-primary">
                          <div className="flex items-center gap-2">
                            <span>{coupon.code}</span>
                            <button
                              onClick={() => copyCode(coupon.code, coupon.id)}
                              className="p-1 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                              title="Copy code"
                            >
                              {copiedId === coupon.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                            </button>
                          </div>
                        </td>
                        <td className="px-6 py-4 capitalize font-medium">{coupon.type}</td>
                        <td className="px-6 py-4 font-bold text-foreground">
                          {coupon.type === 'percentage' ? `${Number(coupon.value).toFixed(0)}%` : `$${Number(coupon.value).toFixed(2)}`}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold">
                          {coupon.usedCount} {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit}` : 'redemptions'}
                        </td>
                        <td className="px-6 py-4 text-xs text-muted-foreground font-medium">
                          {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                            coupon.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'
                          }`}>
                            {coupon.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggle(coupon.id)}
                              className={`p-1.5 rounded-lg transition-colors cursor-pointer text-xs font-bold ${
                                coupon.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-emerald-600 hover:bg-emerald-50'
                              }`}
                              title={coupon.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {coupon.isActive ? '⏸' : '▶'}
                            </button>
                            <button
                              onClick={() => {
                                setEditingCoupon(coupon);
                                setForm({
                                  code: coupon.code,
                                  type: coupon.type,
                                  value: coupon.value.toString(),
                                  minOrder: coupon.minOrder?.toString() || '',
                                  maxDiscount: coupon.maxDiscount?.toString() || '',
                                  expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
                                  usageLimit: coupon.usageLimit?.toString() || '',
                                });
                                setShowModal(true);
                              }}
                              className="p-1.5 text-blue-500 hover:bg-blue-50 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit size={14} />
                            </button>
                            <button
                              onClick={() => handleDelete(coupon.id)}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
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
            </div>

            {/* Mobile Card View */}
            <div className="grid grid-cols-1 gap-4 md:hidden">
              {coupons.map((coupon) => (
                <div key={coupon.id} className="bg-card p-5 rounded-2xl border border-border/50 shadow-sm space-y-4">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2 font-mono font-bold text-primary text-base">
                      <span>{coupon.code}</span>
                      <button
                        onClick={() => copyCode(coupon.code, coupon.id)}
                        className="p-1.5 hover:bg-secondary rounded-lg transition-colors cursor-pointer"
                        title="Copy code"
                      >
                        {copiedId === coupon.id ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
                      </button>
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      coupon.isActive ? 'bg-emerald-50 text-emerald-700 border-emerald-200/50' : 'bg-red-50 text-red-700 border-red-200/50'
                    }`}>
                      {coupon.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-y-2 text-xs">
                    <div>
                      <span className="text-muted-foreground block">Discount Value</span>
                      <span className="font-bold text-foreground">
                        {coupon.type === 'percentage' ? `${Number(coupon.value).toFixed(0)}%` : `$${Number(coupon.value).toFixed(2)}`}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Redemptions</span>
                      <span className="font-semibold text-foreground">
                        {coupon.usedCount} {coupon.usageLimit > 0 ? `/ ${coupon.usageLimit}` : 'redemptions'}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Coupon Type</span>
                      <span className="capitalize font-medium text-foreground">{coupon.type}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Expires On</span>
                      <span className="text-muted-foreground font-medium">
                        {coupon.expiresAt ? new Date(coupon.expiresAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Never'}
                      </span>
                    </div>
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-border/40">
                    <button
                      onClick={() => handleToggle(coupon.id)}
                      className={`px-3 py-1.5 border border-border rounded-xl text-xs font-semibold flex items-center gap-1 cursor-pointer ${
                        coupon.isActive ? 'text-yellow-600 hover:bg-yellow-50' : 'text-emerald-600 hover:bg-emerald-50'
                      }`}
                    >
                      {coupon.isActive ? 'Pause' : 'Activate'}
                    </button>
                    <button
                      onClick={() => {
                        setEditingCoupon(coupon);
                        setForm({
                          code: coupon.code,
                          type: coupon.type,
                          value: coupon.value.toString(),
                          minOrder: coupon.minOrder?.toString() || '',
                          maxDiscount: coupon.maxDiscount?.toString() || '',
                          expiresAt: coupon.expiresAt ? coupon.expiresAt.split('T')[0] : '',
                          usageLimit: coupon.usageLimit?.toString() || '',
                        });
                        setShowModal(true);
                      }}
                      className="p-2 border border-border text-blue-500 hover:bg-blue-50 rounded-xl cursor-pointer"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(coupon.id)}
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

      {/* Create / Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-card rounded-3xl max-w-md w-full p-6 md:p-8 max-h-[90vh] overflow-y-auto border border-border/50 shadow-xl space-y-6">
            <div>
              <h2 className="text-2xl font-playfair font-bold text-foreground">
                {editingCoupon ? 'Edit Coupon' : 'Create Coupon'}
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure discounts rules and constraints</p>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Coupon Code</label>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm({...form, code: e.target.value.toUpperCase()})}
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 font-mono font-bold tracking-wider"
                  required
                  placeholder="SAVE20"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({...form, type: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  >
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed ($)</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Discount Value</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.value}
                    onChange={(e) => setForm({...form, value: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    required
                    placeholder={form.type === 'percentage' ? '20' : '10.00'}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Min Order ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.minOrder}
                    onChange={(e) => setForm({...form, minOrder: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="0.00"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Max Discount ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={form.maxDiscount}
                    onChange={(e) => setForm({...form, maxDiscount: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="None"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Expiry Date</label>
                  <input
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({...form, expiresAt: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Usage Limit</label>
                  <input
                    type="number"
                    value={form.usageLimit}
                    onChange={(e) => setForm({...form, usageLimit: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                    placeholder="0 (Unlimited)"
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-3">
                <button
                  type="submit"
                  className="flex-1 py-3 bg-primary text-white rounded-full font-bold text-xs hover:bg-primary/95 transition-all active:scale-95 cursor-pointer select-none"
                >
                  {editingCoupon ? 'Update Coupon' : 'Create Coupon'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditingCoupon(null);
                  }}
                  className="flex-1 py-3 bg-secondary text-foreground rounded-full font-bold text-xs hover:bg-secondary/80 transition-all active:scale-95 cursor-pointer select-none"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
