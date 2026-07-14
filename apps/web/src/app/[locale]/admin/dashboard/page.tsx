'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { 
  Users, 
  Package, 
  ShoppingBag, 
  DollarSign, 
  Clock
} from 'lucide-react';
import Link from 'next/link';

interface Stats {
  users: number;
  products: number;
  orders: number;
  pendingOrders: number;
  revenue: number;
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(res => setStats(res.data))
      .catch(err => console.error('Failed to fetch stats', err))
      .finally(() => setLoading(false));
  }, []);

  const statCards = stats ? [
    { icon: Users, label: 'Users', value: stats.users, color: 'bg-blue-500', link: '/en/admin/users' },
    { icon: Package, label: 'Products', value: stats.products, color: 'bg-green-500', link: '/en/admin/products' },
    { icon: ShoppingBag, label: 'Orders', value: stats.orders, color: 'bg-purple-500', link: '/en/admin/orders' },
    { icon: Clock, label: 'Pending Orders', value: stats.pendingOrders, color: 'bg-orange-500', link: '/en/admin/orders' },
    { icon: DollarSign, label: 'Revenue', value: `$${stats.revenue.toFixed(2)}`, color: 'bg-emerald-500', link: '/en/admin/orders' },
  ] : [];

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-playfair font-bold">Dashboard</h1>
            <p className="text-sm text-muted-foreground">Welcome back, Admin</p>
          </div>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading stats...</div>
          ) : (
            <>
              {/* Stats Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                {statCards.map((item) => (
                  <Link href={item.link} key={item.label}>
                    <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 hover:shadow-md transition-shadow">
                      <div className="flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${item.color}/10 text-white`}>
                          <item.icon size={24} className={`${item.color}`} />
                        </div>
                        <div>
                          <p className="text-2xl font-bold">{item.value}</p>
                          <p className="text-sm text-muted-foreground">{item.label}</p>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Quick Actions */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                  <h3 className="font-semibold mb-4">Recent Activity</h3>
                  <p className="text-sm text-muted-foreground">No recent activity to show.</p>
                </div>
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                  <h3 className="font-semibold mb-4">Quick Actions</h3>
                  <div className="space-y-2">
                    <Link href="/en/admin/products" className="block w-full text-left px-4 py-2 bg-secondary/50 rounded-lg hover:bg-secondary transition text-sm">
                      ➕ Add New Product
                    </Link>
                    <Link href="/en/admin/orders" className="block w-full text-left px-4 py-2 bg-secondary/50 rounded-lg hover:bg-secondary transition text-sm">
                      📦 View Pending Orders
                    </Link>
                    <Link href="/en/admin/users" className="block w-full text-left px-4 py-2 bg-secondary/50 rounded-lg hover:bg-secondary transition text-sm">
                      👥 Manage Users
                    </Link>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </AdminLayout>
    </AdminGuard>
  );
}
