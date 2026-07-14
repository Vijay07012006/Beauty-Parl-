'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { Trash2, Shield, ShieldOff, Check, AlertTriangle } from 'lucide-react';

interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = () => {
    setLoading(true);
    api.get('/admin/users')
      .then(res => setUsers(res.data.users || []))
      .catch(err => console.error('Failed to fetch users', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const toggleRole = async (id: number, currentRole: string) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin';
    try {
      await api.put(`/admin/users/${id}/role`, { role: newRole });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user role');
    }
  };

  const toggleStatus = async (id: number, currentStatus: boolean) => {
    try {
      await api.put(`/admin/users/${id}/status`, { isActive: !currentStatus });
      fetchUsers();
    } catch (err) {
      alert('Failed to update user status');
    }
  };

  const deleteUser = async (id: number) => {
    if (!confirm('Are you sure you want to delete this user?')) return;
    try {
      await api.delete(`/admin/users/${id}`);
      fetchUsers();
    } catch (err) {
      alert('Failed to delete user');
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-playfair font-bold">Users</h1>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading users...</div>
          ) : users.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No users found.</div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Name</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Email</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Role</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Joined</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-secondary/20 transition">
                      <td className="px-6 py-3 font-medium">{user.name}</td>
                      <td className="px-6 py-3 text-muted-foreground">{user.email}</td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium uppercase ${
                          user.role === 'admin' || user.role === 'super_admin' 
                            ? 'bg-purple-100 text-purple-700 font-bold' 
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {user.role}
                        </span>
                      </td>
                      <td className="px-6 py-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-right space-x-2">
                        {user.role !== 'super_admin' && (
                          <>
                            <button
                              onClick={() => toggleRole(user.id, user.role)}
                              className="p-2 text-purple-500 hover:bg-purple-50 rounded-full transition cursor-pointer"
                              title="Toggle Admin Role"
                            >
                              {user.role === 'admin' ? <ShieldOff size={18} /> : <Shield size={18} />}
                            </button>
                            <button
                              onClick={() => toggleStatus(user.id, user.isActive)}
                              className={`p-2 ${user.isActive ? 'text-orange-500 hover:bg-orange-50' : 'text-green-500 hover:bg-green-50'} rounded-full transition cursor-pointer`}
                              title={user.isActive ? 'Deactivate User' : 'Activate User'}
                            >
                              {user.isActive ? <AlertTriangle size={18} /> : <Check size={18} />}
                            </button>
                            <button
                              onClick={() => deleteUser(user.id)}
                              className="p-2 text-red-500 hover:bg-red-50 rounded-full transition cursor-pointer"
                              title="Delete User"
                            >
                              <Trash2 size={18} />
                            </button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
