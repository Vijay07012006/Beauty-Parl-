'use client';

import { useState, useEffect } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { api } from '@/lib/api';
import { Plus, Pencil, Trash2, Shield, Check, X } from 'lucide-react';
import { toast } from 'sonner';

const AVAILABLE_PERMISSIONS = [
  'products.read', 'products.write', 'products.delete',
  'orders.read', 'orders.write',
  'users.read', 'users.write',
  'coupons.read', 'coupons.write',
  'reviews.read', 'reviews.write',
  'analytics.read',
];

interface Role {
  id: number;
  name: string;
  permissions: string[];
  isActive: boolean;
  createdAt: string;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ open: boolean; role: Role | null }>({ open: false, role: null });
  const [form, setForm] = useState({ name: '', permissions: [] as string[], isActive: true });
  const [saving, setSaving] = useState(false);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const res = await api.get('/roles');
      setRoles(res.data || []);
    } catch {
      toast.error('Failed to load roles');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchRoles(); }, []);

  const openCreate = () => {
    setForm({ name: '', permissions: [], isActive: true });
    setModal({ open: true, role: null });
  };

  const openEdit = (role: Role) => {
    setForm({ name: role.name, permissions: role.permissions || [], isActive: role.isActive });
    setModal({ open: true, role });
  };

  const togglePermission = (perm: string) => {
    setForm(f => ({
      ...f,
      permissions: f.permissions.includes(perm)
        ? f.permissions.filter(p => p !== perm)
        : [...f.permissions, perm],
    }));
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Role name is required'); return; }
    setSaving(true);
    try {
      if (modal.role) {
        await api.put(`/roles/${modal.role.id}`, form);
        toast.success('Role updated');
      } else {
        await api.post('/roles', form);
        toast.success('Role created');
      }
      setModal({ open: false, role: null });
      fetchRoles();
    } catch {
      toast.error('Failed to save role');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (role: Role) => {
    if (!confirm(`Delete role "${role.name}"?`)) return;
    try {
      await api.delete(`/roles/${role.id}`);
      toast.success('Role deleted');
      fetchRoles();
    } catch {
      toast.error('Failed to delete role');
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Role Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Create and manage custom roles with granular permissions</p>
          </div>
          <button
            onClick={openCreate}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-white rounded-xl hover:bg-primary/90 transition text-sm font-medium shadow-sm shadow-primary/20"
          >
            <Plus size={16} />
            Create Role
          </button>
        </div>

        {/* Roles Grid */}
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {roles.map(role => (
              <div key={role.id} className="bg-card border border-border/40 rounded-2xl p-5 space-y-4 hover:border-primary/30 transition-colors">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Shield size={18} className="text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold capitalize">{role.name}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                        role.isActive ? 'bg-emerald-100 text-emerald-700' : 'bg-secondary text-muted-foreground'
                      }`}>
                        {role.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => openEdit(role)} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition">
                      <Pencil size={14} />
                    </button>
                    <button onClick={() => handleDelete(role)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {(role.permissions || []).slice(0, 6).map(perm => (
                    <span key={perm} className="px-2 py-0.5 bg-secondary/50 rounded-full text-[10px] font-mono text-muted-foreground">
                      {perm}
                    </span>
                  ))}
                  {(role.permissions || []).length > 6 && (
                    <span className="px-2 py-0.5 bg-primary/10 text-primary rounded-full text-[10px] font-bold">
                      +{(role.permissions || []).length - 6} more
                    </span>
                  )}
                  {(role.permissions || []).length === 0 && (
                    <span className="text-xs text-muted-foreground italic">No permissions assigned</span>
                  )}
                </div>

                <p className="text-[10px] text-muted-foreground">
                  Created {new Date(role.createdAt).toLocaleDateString()}
                </p>
              </div>
            ))}

            {roles.length === 0 && !loading && (
              <div className="col-span-3 text-center py-16 text-muted-foreground">
                <Shield size={40} className="mx-auto mb-3 opacity-20" />
                <p className="text-sm">No roles created yet. Create your first role to get started.</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Modal */}
      {modal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-card border border-border/60 rounded-3xl p-6 w-full max-w-lg shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold">{modal.role ? 'Edit Role' : 'Create New Role'}</h2>
              <button onClick={() => setModal({ open: false, role: null })} className="p-1 rounded-lg hover:bg-secondary transition">
                <X size={18} />
              </button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1.5 block">Role Name</label>
                <input
                  type="text"
                  placeholder="e.g. manager, analyst..."
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-4 py-2.5 rounded-xl border border-border/60 bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">Permissions</label>
                <div className="grid grid-cols-2 gap-2">
                  {AVAILABLE_PERMISSIONS.map(perm => (
                    <button
                      key={perm}
                      onClick={() => togglePermission(perm)}
                      className={`flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-mono transition border ${
                        form.permissions.includes(perm)
                          ? 'bg-primary/10 border-primary/30 text-primary'
                          : 'border-border/40 hover:bg-secondary/40'
                      }`}
                    >
                      <div className={`w-4 h-4 rounded flex items-center justify-center shrink-0 ${
                        form.permissions.includes(perm) ? 'bg-primary' : 'border border-border/60'
                      }`}>
                        {form.permissions.includes(perm) && <Check size={10} className="text-white" />}
                      </div>
                      {perm}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active</label>
                <button
                  onClick={() => setForm(f => ({ ...f, isActive: !f.isActive }))}
                  className={`relative w-10 h-5.5 rounded-full transition-colors ${form.isActive ? 'bg-primary' : 'bg-border/60'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isActive ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </button>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setModal({ open: false, role: null })}
                className="flex-1 py-2.5 rounded-xl border border-border/60 hover:bg-secondary/40 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="flex-1 py-2.5 rounded-xl bg-primary text-white hover:bg-primary/90 text-sm font-medium transition disabled:opacity-50"
              >
                {saving ? 'Saving...' : modal.role ? 'Update Role' : 'Create Role'}
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
