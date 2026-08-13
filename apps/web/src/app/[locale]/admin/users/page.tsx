'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Search, Download, UserX, UserCheck, Trash2, Eye, Users, ShieldCheck, UserMinus, Ban } from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  loyaltyPoints?: number;
  totalSpent?: number;
}

export default function AdminUsersPage() {
  const { user: me } = useAuthStore();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [suspendModal, setSuspendModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [suspendReason, setSuspendReason] = useState('');
  const [suspendDuration, setSuspendDuration] = useState<'1d' | '7d' | '30d' | 'permanent'>('7d');
  
  const [terminateModal, setTerminateModal] = useState<{ open: boolean; user: User | null }>({ open: false, user: null });
  const [terminateReason, setTerminateReason] = useState('');
  const isSuperAdmin = me?.role === 'super_admin';

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users?limit=100');
      setUsers(res.data.users || []);
    } catch {
      toast.error('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const handleSuspend = async () => {
    if (!suspendModal.user) return;
    try {
      await api.put(`/admin/users/${suspendModal.user.id}/suspend`, {
        reason: suspendReason || 'Policy violation',
        duration: suspendDuration,
      });
      toast.success(`User "${suspendModal.user.name}" suspended for ${suspendDuration}`);
      setSuspendModal({ open: false, user: null });
      setSuspendReason('');
      fetchUsers();
    } catch {
      toast.error('Failed to suspend user');
    }
  };

  const handleReactivate = async (u: User) => {
    try {
      await api.put(`/admin/users/${u.id}/reactivate`);
      toast.success(`User "${u.name}" reactivated`);
      fetchUsers();
    } catch {
      toast.error('Failed to reactivate user');
    }
  };

  const handleDelete = async (u: User) => {
    if (!confirm(`⚠️ Permanently delete "${u.name}"? This cannot be undone!`)) return;
    try {
      await api.delete(`/admin/users/${u.id}/permanent`);
      toast.success(`User "${u.name}" permanently deleted`);
      fetchUsers();
    } catch {
      toast.error('Failed to delete user');
    }
  };

  const handleTerminate = async () => {
    if (!terminateModal.user) return;
    try {
      await api.delete(`/admin/users/${terminateModal.user.id}/terminate`, {
        data: { reason: terminateReason || 'Policy violation' }
      });
      toast.success(`User "${terminateModal.user.name}" terminated successfully`);
      setTerminateModal({ open: false, user: null });
      setTerminateReason('');
      fetchUsers();
    } catch {
      toast.error('Failed to terminate user');
    }
  };

  const filtered = users.filter(u =>
    u.name?.toLowerCase().includes(search.toLowerCase()) ||
    u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const roleColor = (role: string) => {
    if (role === 'super_admin') return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
    if (role === 'admin') return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
    return 'bg-secondary text-muted-foreground';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Manage all platform users and their permissions</p>
          </div>
          {isSuperAdmin && (
            <Link
              href={`/${locale}/admin/user-management`}
              className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition text-sm font-medium shadow-sm shadow-primary/20"
            >
              <ShieldCheck size={16} />
              Bulk Management
            </Link>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Users', value: users.length, icon: Users, color: 'text-blue-600' },
            { label: 'Active', value: users.filter(u => u.isActive).length, icon: UserCheck, color: 'text-emerald-600' },
            { label: 'Admins', value: users.filter(u => u.role === 'admin' || u.role === 'super_admin').length, icon: ShieldCheck, color: 'text-purple-600' },
            { label: 'Suspended', value: users.filter(u => !u.isActive).length, icon: UserMinus, color: 'text-red-500' },
          ].map(stat => (
            <div key={stat.label} className="bg-card border border-border/40 rounded-2xl p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center">
                <stat.icon size={18} className={stat.color} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
                <p className="text-2xl font-bold">{stat.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
          />
        </div>

        {/* Table */}
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
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden lg:table-cell">Joined</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(u => (
                    <tr key={u.id} className="hover:bg-secondary/10 transition-colors">
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {u.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="font-medium truncate max-w-[120px]">{u.name}</span>
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${roleColor(u.role)}`}>
                          {u.role?.replace('_', ' ').toUpperCase() || 'USER'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          u.isActive
                            ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden lg:table-cell text-xs">
                        {new Date(u.createdAt).toLocaleDateString([], { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center justify-end gap-1">
                          <Link href={`/${locale}/admin/users/${u.id}`}>
                            <button className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition" title="View">
                              <Eye size={15} />
                            </button>
                          </Link>
                          {isSuperAdmin && u.id !== me?.id && (
                            <>
                              {u.isActive ? (
                                <button
                                  onClick={() => setSuspendModal({ open: true, user: u })}
                                  className="p-2 text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-900/20 rounded-lg transition"
                                  title="Suspend"
                                >
                                  <UserX size={15} />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleReactivate(u)}
                                  className="p-2 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded-lg transition"
                                  title="Reactivate"
                                >
                                  <UserCheck size={15} />
                                </button>
                              )}
                              <button
                                onClick={() => handleDelete(u)}
                                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Permanent Delete"
                              >
                                <Trash2 size={15} />
                              </button>
                              <button
                                onClick={() => setTerminateModal({ open: true, user: u })}
                                className="p-2 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition"
                                title="Terminate Account"
                              >
                                <Ban size={15} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground">
                  <Users size={32} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No users found</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Suspend Modal */}
      {suspendModal.open && suspendModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-1">Suspend User</h2>
            <p className="text-sm text-muted-foreground mb-5">
              Suspending <strong>{suspendModal.user.name}</strong>. They will receive an email notification.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Duration</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['1d', '7d', '30d', 'permanent'] as const).map(d => (
                    <button
                      key={d}
                      onClick={() => setSuspendDuration(d)}
                      className={`py-2 rounded-xl text-sm font-medium transition border ${
                        suspendDuration === d
                          ? 'bg-primary text-white border-primary'
                          : 'border-border/60 hover:bg-secondary/40'
                      }`}
                    >
                      {d === '1d' ? '1 Day' : d === '7d' ? '7 Days' : d === '30d' ? '30 Days' : 'Permanent'}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Policy violation, spam..."
                  value={suspendReason}
                  onChange={e => setSuspendReason(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setSuspendModal({ open: false, user: null })}
                className="flex-1 py-2.5 rounded-xl border border-border/60 hover:bg-secondary/40 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSuspend}
                className="flex-1 py-2.5 rounded-xl bg-amber-500 text-white hover:bg-amber-600 text-sm font-medium transition"
              >
                Suspend User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Terminate Modal */}
      {terminateModal.open && terminateModal.user && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-md shadow-2xl">
            <div className="flex items-center gap-3 text-red-600 mb-3">
              <Ban size={24} />
              <h2 className="text-lg font-bold">Terminate User Account</h2>
            </div>
            <p className="text-sm text-muted-foreground mb-5">
              You are terminating <strong>{terminateModal.user.name}</strong> permanently. This user will not be able to log in, and an immediate email notification will be dispatched.
            </p>

            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Termination Reason</label>
              <input
                type="text"
                placeholder="e.g. Terms violation, severe abuse..."
                value={terminateReason}
                onChange={e => setTerminateReason(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setTerminateModal({ open: false, user: null })}
                className="flex-1 py-2.5 rounded-xl border border-border/60 hover:bg-secondary/40 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleTerminate}
                className="flex-1 py-2.5 rounded-xl bg-red-600 text-white hover:bg-red-700 text-sm font-medium transition"
              >
                Terminate User
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
