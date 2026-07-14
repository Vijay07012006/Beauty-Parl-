'use client';

import { useEffect, useState } from 'react';
import { AdminLayout } from '@/components/admin/AdminLayout';
import { AdminGuard } from '@/components/admin/AdminGuard';
import { api } from '@/lib/api';
import { Eye, X } from 'lucide-react';
import Image from 'next/image';

interface Order {
  id: number;
  userId: number;
  guestEmail: string;
  items: any[];
  total: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
  shippingAddress: any;
}

const statuses = ['pending', 'paid', 'shipped', 'delivered', 'cancelled'];

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchOrders = () => {
    setLoading(true);
    api.get('/admin/orders')
      .then(res => setOrders(res.data.orders || []))
      .catch(err => console.error('Failed to fetch orders', err))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const updateStatus = async (id: number, status: string) => {
    try {
      await api.put(`/admin/orders/${id}/status`, { status });
      fetchOrders();
      if (selectedOrder && selectedOrder.id === id) {
        setSelectedOrder({ ...selectedOrder, status });
      }
    } catch (err) {
      alert('Failed to update order status');
    }
  };

  return (
    <AdminGuard>
      <AdminLayout>
        <div className="space-y-6">
          <h1 className="text-3xl font-playfair font-bold">Orders</h1>

          {loading ? (
            <div className="text-center py-12 text-muted-foreground">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders yet.</div>
          ) : (
            <div className="bg-card rounded-2xl shadow-sm border border-border/50 overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead className="bg-secondary/30">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Order #</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Customer</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Total</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Payment</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Status</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-muted-foreground">Date</th>
                    <th className="px-6 py-3 text-right text-sm font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-secondary/20 transition">
                      <td className="px-6 py-3 font-medium">#{order.id}</td>
                      <td className="px-6 py-3 text-sm max-w-[200px] truncate">
                        {order.guestEmail || `User ID: ${order.userId}`}
                      </td>
                      <td className="px-6 py-3 font-bold text-primary">${Number(order.total).toFixed(2)}</td>
                      <td className="px-6 py-3 text-sm">{order.paymentMethod.toUpperCase()}</td>
                      <td className="px-6 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => updateStatus(order.id, e.target.value)}
                          className={`px-3 py-1 rounded-full text-xs font-medium border-0 focus:ring-2 focus:ring-primary/50 cursor-pointer ${
                            order.status === 'delivered' ? 'bg-green-100 text-green-700' :
                            order.status === 'cancelled' ? 'bg-red-100 text-red-700' :
                            order.status === 'shipped' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}
                        >
                          {statuses.map((s) => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                      </td>
                      <td className="px-6 py-3 text-sm text-muted-foreground">
                        {new Date(order.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-3 text-right">
                        <button
                          onClick={() => setSelectedOrder(order)}
                          className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition cursor-pointer"
                        >
                          <Eye size={18} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Order Details Modal */}
        {selectedOrder && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-card rounded-2xl shadow-xl max-w-xl w-full p-6 max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in duration-200">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-playfair font-bold">Order Details #{selectedOrder.id}</h2>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="p-1 hover:bg-secondary rounded-full transition cursor-pointer"
                >
                  <X size={20} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Order Metadata */}
                <div className="grid grid-cols-2 gap-4 text-sm bg-secondary/20 p-4 rounded-xl">
                  <div>
                    <p className="text-muted-foreground">Date</p>
                    <p className="font-semibold">{new Date(selectedOrder.createdAt).toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Status</p>
                    <p className="font-semibold capitalize">{selectedOrder.status}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Payment Method</p>
                    <p className="font-semibold uppercase">{selectedOrder.paymentMethod}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Total</p>
                    <p className="font-bold text-primary">${Number(selectedOrder.total).toFixed(2)}</p>
                  </div>
                </div>

                {/* Customer Address */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Shipping Information</h3>
                  <div className="text-sm bg-secondary/10 p-4 rounded-xl space-y-1">
                    <p><span className="text-muted-foreground">Name:</span> {selectedOrder.shippingAddress.name}</p>
                    <p><span className="text-muted-foreground">Email:</span> {selectedOrder.shippingAddress.email}</p>
                    <p><span className="text-muted-foreground">Phone:</span> {selectedOrder.shippingAddress.phone}</p>
                    <p><span className="text-muted-foreground">Address:</span> {selectedOrder.shippingAddress.address}, {selectedOrder.shippingAddress.city}, {selectedOrder.shippingAddress.state} - {selectedOrder.shippingAddress.pincode}</p>
                  </div>
                </div>

                {/* Items List */}
                <div>
                  <h3 className="font-semibold text-lg mb-2">Order Items</h3>
                  <div className="divide-y divide-border/50">
                    {selectedOrder.items.map((item: any, idx: number) => (
                      <div key={idx} className="flex items-center gap-4 py-3">
                        <div className="relative w-12 h-12 bg-secondary/20 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image ? (
                            <Image src={item.image} alt={item.name} fill className="object-cover" sizes="48px" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-xs">💄</div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium text-sm">{item.name}</p>
                          <p className="text-xs text-muted-foreground">${Number(item.price).toFixed(2)} x {item.quantity}</p>
                        </div>
                        <p className="font-semibold text-sm">${(Number(item.price) * item.quantity).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </AdminLayout>
    </AdminGuard>
  );
}
