'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { Search, UserX, UserCheck, Trash2, ShieldCheck, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

const ROLES = ['user', 'admin', 'super_admin'];

export default function UserManagementPage() {
  const { user: me } = useAuthStore();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [bulkAction, setBulkAction] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [processing, setProcessing] = useState(false);

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

  const filtered = users.filter(u => {
    const matchSearch = u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase());
    const matchRole = roleFilter === 'all' || u.role === roleFilter;
    const matchStatus = statusFilter === 'all' || (statusFilter === 'active' ? u.isActive : !u.isActive);
    return matchSearch && matchRole && matchStatus;
  });

  const toggleSelect = (id: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === filtered.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(filtered.map(u => u.id)));
    }
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selected.size === 0) {
      toast.error('Select an action and at least one user');
      return;
    }
    if (selected.has(me?.id as number)) {
      toast.error('You cannot perform actions on your own account');
      return;
    }
    if (!confirm(`Apply "${bulkAction}" to ${selected.size} users?`)) return;

    setProcessing(true);
    const ids = Array.from(selected);
    let successCount = 0;
    let failCount = 0;

    for (const id of ids) {
      try {
        if (bulkAction === 'suspend') {
          await api.put(`/admin/users/${id}/suspend`, { reason: 'Bulk action', duration: '7d' });
        } else if (bulkAction === 'reactivate') {
          await api.put(`/admin/users/${id}/reactivate`);
        } else if (bulkAction === 'delete') {
          await api.delete(`/admin/users/${id}/permanent`);
        } else if (bulkAction.startsWith('role:')) {
          const newRole = bulkAction.split(':')[1];
          await api.put(`/admin/users/${id}/role`, { role: newRole });
        }
        successCount++;
      } catch {
        failCount++;
      }
    }

    toast.success(`${successCount} users updated${failCount > 0 ? `, ${failCount} failed` : ''}`);
    setSelected(new Set());
    setBulkAction('');
    fetchUsers();
    setProcessing(false);
  };

  const handleRoleChange = async (userId: number, newRole: string) => {
    if (userId === me?.id) { toast.error("You can't change your own role"); return; }
    try {
      await api.put(`/admin/users/${userId}/role`, { role: newRole });
      toast.success('Role updated');
      fetchUsers();
    } catch {
      toast.error('Failed to update role');
    }
  };

  const roleColor = (role: string) => {
    if (role === 'super_admin') return 'bg-purple-100 text-purple-700';
    if (role === 'admin') return 'bg-blue-100 text-blue-700';
    return 'bg-secondary text-muted-foreground';
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Bulk User Management</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Select users and apply bulk actions or change roles individually</p>
        </div>

        {/* Filters Row */}
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search users..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 transition"
            />
          </div>

          <select
            value={roleFilter}
            onChange={e => setRoleFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All Roles</option>
            <option value="user">User</option>
            <option value="admin">Admin</option>
            <option value="super_admin">Super Admin</option>
          </select>

          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-border/60 bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="suspended">Suspended</option>
          </select>
        </div>

        {/* Bulk Actions Bar */}
        {selected.size > 0 && (
          <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-2xl px-5 py-3">
            <AlertTriangle size={16} className="text-primary shrink-0" />
            <span className="text-sm font-medium text-primary">{selected.size} users selected</span>
            <div className="flex-1" />
            <select
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="px-3 py-2 rounded-xl border border-border/60 bg-card text-sm focus:outline-none"
            >
              <option value="">Choose action...</option>
              <option value="suspend">🚫 Suspend (7 days)</option>
              <option value="reactivate">✅ Reactivate</option>
              <option value="role:user">👤 Set Role: User</option>
              <option value="role:admin">🛡 Set Role: Admin</option>
              <option value="delete">🗑 Permanent Delete</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={processing || !bulkAction}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm font-medium hover:bg-primary/90 transition disabled:opacity-50"
            >
              {processing ? 'Processing...' : 'Apply'}
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="px-3 py-2 border border-border/60 rounded-xl text-sm hover:bg-secondary/40 transition"
            >
              Clear
            </button>
          </div>
        )}

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
                    <th className="px-5 py-3.5 text-left">
                      <input
                        type="checkbox"
                        checked={selected.size === filtered.length && filtered.length > 0}
                        onChange={toggleSelectAll}
                        className="rounded cursor-pointer accent-primary"
                      />
                    </th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider hidden md:table-cell">Email</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
                    <th className="px-5 py-3.5 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                    <th className="px-5 py-3.5 text-right text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {filtered.map(u => (
                    <tr key={u.id} className={`transition-colors hover:bg-secondary/10 ${selected.has(u.id) ? 'bg-primary/5' : ''}`}>
                      <td className="px-5 py-3.5">
                        <input
                          type="checkbox"
                          checked={selected.has(u.id)}
                          onChange={() => toggleSelect(u.id)}
                          disabled={u.id === me?.id}
                          className="rounded cursor-pointer accent-primary disabled:opacity-30"
                        />
                      </td>
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/30 to-primary/60 flex items-center justify-center text-xs font-bold text-primary shrink-0">
                            {u.name?.charAt(0)?.toUpperCase()}
                          </div>
                          <span className="font-medium truncate max-w-[100px]">{u.name}</span>
                          {u.id === me?.id && (
                            <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">You</span>
                          )}
                        </div>
                      </td>
                      <td className="px-5 py-3.5 text-muted-foreground hidden md:table-cell text-xs">{u.email}</td>
                      <td className="px-5 py-3.5">
                        <select
                          value={u.role}
                          onChange={e => handleRoleChange(u.id, e.target.value)}
                          disabled={u.id === me?.id}
                          className={`px-2.5 py-1 rounded-xl text-xs font-semibold border-0 focus:outline-none focus:ring-2 focus:ring-primary/30 cursor-pointer disabled:cursor-default ${roleColor(u.role)}`}
                        >
                          {ROLES.map(r => (
                            <option key={r} value={r}>{r.replace('_', ' ').toUpperCase()}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-5 py-3.5">
                        <span className={`px-2.5 py-1 rounded-full text-[11px] font-semibold ${
                          u.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-600'
                        }`}>
                          {u.isActive ? 'Active' : 'Suspended'}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        {u.id !== me?.id && (
                          <div className="flex items-center justify-end gap-1">
                            {u.isActive ? (
                              <button
                                onClick={async () => {
                                  await api.put(`/admin/users/${u.id}/suspend`, { reason: 'Admin action', duration: '7d' });
                                  toast.success('Suspended'); fetchUsers();
                                }}
                                className="p-1.5 text-amber-500 hover:bg-amber-50 rounded-lg transition"
                                title="Suspend"
                              >
                                <UserX size={14} />
                              </button>
                            ) : (
                              <button
                                onClick={async () => {
                                  await api.put(`/admin/users/${u.id}/reactivate`);
                                  toast.success('Reactivated'); fetchUsers();
                                }}
                                className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded-lg transition"
                                title="Reactivate"
                              >
                                <UserCheck size={14} />
                              </button>
                            )}
                            <button
                              onClick={async () => {
                                if (!confirm(`Delete ${u.name}?`)) return;
                                await api.delete(`/admin/users/${u.id}/permanent`);
                                toast.success('Deleted'); fetchUsers();
                              }}
                              className="p-1.5 text-red-500 hover:bg-red-50 rounded-lg transition"
                              title="Delete"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No users match your filters</div>
              )}
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
