'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { ArrowLeft, Package, Truck, CheckCircle, XCircle } from 'lucide-react';
import Link from 'next/link';

const statusIcons = {
  pending: <Package size={20} className="text-yellow-500 animate-pulse" />,
  paid: <CheckCircle size={20} className="text-emerald-500" />,
  processing: <Package size={20} className="text-blue-500" />,
  shipped: <Truck size={20} className="text-purple-500" />,
  delivered: <CheckCircle size={20} className="text-green-500" />,
  cancelled: <XCircle size={20} className="text-red-500" />,
};

const statusLabels = {
  pending: 'Pending Payment',
  paid: 'Paid',
  processing: 'Processing',
  shipped: 'Shipped',
  delivered: 'Delivered',
  cancelled: 'Cancelled',
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;
  const locale = (params?.locale as string) || 'en';

  const { token } = useAuthStore();
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    if (id) {
      api.get(`/orders/${id}`)
        .then(res => setOrder(res.data))
        .catch(() => router.push(`/${locale}/orders`))
        .finally(() => setLoading(false));
    }
  }, [id, token, locale]);

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-3xl">
            <div className="animate-pulse bg-card rounded-3xl h-96 border border-border/50" />
          </div>
        </main>
        <Footer />
      </>
    );
  }

  if (!order) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10 text-center">
          <div className="bg-card max-w-md mx-auto p-8 rounded-3xl border border-border/50 space-y-4">
            <p className="text-muted-foreground">Order not found</p>
            <Link href={`/${locale}/orders`} className="inline-block px-6 py-2.5 bg-primary text-white rounded-full text-sm font-semibold">
              Back to Orders
            </Link>
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
        <div className="container mx-auto px-4 max-w-3xl space-y-6">
          <Link
            href={`/${locale}/orders`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back to Orders
          </Link>

          <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border/40 pb-6">
              <div>
                <h1 className="text-3xl font-playfair font-bold text-foreground">Order #{order.id}</h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit'
                  })}
                </p>
              </div>
              <div className="flex items-center gap-2 bg-secondary/40 border border-border/20 px-4 py-2 rounded-2xl w-fit">
                {statusIcons[order.status as keyof typeof statusIcons]}
                <span className="font-semibold text-sm text-foreground">
                  {statusLabels[order.status as keyof typeof statusLabels] || order.status}
                </span>
              </div>
            </div>

            {/* Shipping & Payment Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Shipping Address</h3>
                {order.shippingAddress ? (
                  <div className="text-sm space-y-0.5 text-foreground/80">
                    <p className="font-semibold text-foreground">{order.shippingAddress.name}</p>
                    <p>{order.shippingAddress.address}</p>
                    <p>{order.shippingAddress.city}, {order.shippingAddress.state} - {order.shippingAddress.pincode}</p>
                    <p className="text-xs text-muted-foreground mt-1">📞 {order.shippingAddress.phone}</p>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">No address info provided</p>
                )}
              </div>
              
              <div className="space-y-2">
                <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Payment Details</h3>
                <div className="text-sm space-y-1 text-foreground/80">
                  <p>Method: <span className="font-semibold uppercase">{order.paymentMethod}</span></p>
                  {order.paymentId && <p className="text-xs text-muted-foreground">ID: {order.paymentId}</p>}
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="border-t border-border/40 pt-6 space-y-4">
              <h3 className="text-xs font-bold tracking-wider text-muted-foreground uppercase">Order Items</h3>
              <div className="divide-y divide-border/30">
                {order.items?.map((item: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 bg-secondary/20 rounded-xl overflow-hidden relative border border-border/30 shrink-0">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xl">💄</div>
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-sm text-foreground">{item.name}</p>
                        <p className="text-xs text-muted-foreground">Qty: {item.quantity} × ${Number(item.price).toFixed(2)}</p>
                      </div>
                    </div>
                    <p className="font-bold text-foreground text-sm">
                      ${(Number(item.price) * item.quantity).toFixed(2)}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary */}
            <div className="border-t border-border/40 pt-6 space-y-2 max-w-xs ml-auto">
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Subtotal:</span>
                <span>${Number(order.subtotal || (order.total - (order.tax || 0) - (order.shipping || 0))).toFixed(2)}</span>
              </div>
              {order.tax > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Tax (10%):</span>
                  <span>${Number(order.tax).toFixed(2)}</span>
                </div>
              )}
              {order.shipping > 0 && (
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Shipping:</span>
                  <span>${Number(order.shipping).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-base font-bold text-foreground border-t border-border/20 pt-2">
                <span>Total:</span>
                <span className="text-primary">${Number(order.total).toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
