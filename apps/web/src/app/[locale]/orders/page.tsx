'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { Package, Eye, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { motion } from 'framer-motion';

interface Order {
  id: number;
  total: number;
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
  items: any[];
  paymentMethod: string;
}

const statusColors = {
  pending: 'bg-yellow-50 text-yellow-700 border-yellow-200/50',
  paid: 'bg-emerald-50 text-emerald-700 border-emerald-200/50',
  processing: 'bg-blue-50 text-blue-700 border-blue-200/50',
  shipped: 'bg-purple-50 text-purple-700 border-purple-200/50',
  delivered: 'bg-green-50 text-green-700 border-green-200/50',
  cancelled: 'bg-red-50 text-red-700 border-red-200/50',
};

const statusLabels = {
  pending: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrdersPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user, token } = useAuthStore();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchOrders();
  }, [token, locale]);

  const fetchOrders = async (status?: string) => {
    setLoading(true);
    try {
      const url = status && status !== 'all' ? `/orders?status=${status}` : '/orders';
      const response = await api.get(url);
      setOrders(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (status: string) => {
    setFilter(status);
    fetchOrders(status === 'all' ? undefined : status);
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-4xl space-y-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card rounded-2xl h-36 border border-border/50" />
            ))}
          </div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/10">
        <div className="container mx-auto px-4 max-w-4xl space-y-8">
          <div>
            <h1 className="text-4xl font-playfair font-bold text-foreground">My Orders</h1>
            <p className="text-sm text-muted-foreground mt-1">Track and manage your order history</p>
          </div>

          {/* Filters */}
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['all', 'pending', 'processing', 'shipped', 'delivered', 'cancelled'].map((status) => (
              <button
                key={status}
                onClick={() => handleFilterChange(status)}
                className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all border cursor-pointer select-none ${
                  filter === status
                    ? 'bg-primary text-white border-primary shadow-sm'
                    : 'bg-card text-muted-foreground border-border/50 hover:text-foreground hover:bg-secondary/40'
                }`}
              >
                {status === 'all' ? 'All Orders' : statusLabels[status as keyof typeof statusLabels]}
              </button>
            ))}
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-20 bg-card rounded-3xl border border-border/50 space-y-6 max-w-lg mx-auto">
              <Package size={64} className="mx-auto text-muted-foreground/30" />
              <div>
                <h2 className="text-2xl font-playfair font-bold text-foreground">No orders found</h2>
                <p className="text-sm text-muted-foreground mt-1">Start shopping to see your orders here!</p>
              </div>
              <Link href={`/${locale}/products`}>
                <button className="px-8 py-3 bg-primary text-white rounded-full font-semibold hover:bg-primary/95 transition-all shadow-md shadow-primary/25 cursor-pointer">
                  Browse Products
                </button>
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((order, idx) => (
                <motion.div
                  key={order.id}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.04 }}
                  className="bg-card rounded-2xl p-6 border border-border/50 shadow-sm hover:shadow-md transition-all flex flex-col gap-4"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-lg text-foreground">Order #{order.id}</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${statusColors[order.status] || 'bg-secondary text-foreground'}`}>
                          {statusLabels[order.status] || order.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit',
                          month: 'short',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      <div className="text-left sm:text-right">
                        <p className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">Total Amount</p>
                        <p className="font-bold text-lg text-primary">${Number(order.total).toFixed(2)}</p>
                      </div>
                      <Link href={`/${locale}/orders/${order.id}`}>
                        <button className="px-4 py-2.5 bg-primary/10 hover:bg-primary text-primary hover:text-white rounded-full transition-all active:scale-95 flex items-center gap-1.5 text-xs font-bold cursor-pointer select-none">
                          <Eye size={14} />
                          Details
                        </button>
                      </Link>
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex flex-wrap gap-2 items-center">
                    <ShoppingBag size={14} className="text-muted-foreground" />
                    <div className="flex flex-wrap gap-1.5 items-center">
                      {order.items?.slice(0, 3).map((item, idx) => (
                        <span key={idx} className="text-xs text-foreground bg-secondary/60 px-2.5 py-1 rounded-lg border border-border/20 font-medium">
                          {item.name} <span className="text-[10px] text-muted-foreground font-bold">×{item.quantity}</span>
                        </span>
                      ))}
                      {order.items?.length > 3 && (
                        <span className="text-xs text-muted-foreground font-medium pl-1">
                          +{order.items.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
