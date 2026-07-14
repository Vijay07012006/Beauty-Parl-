'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { CheckCircle } from 'lucide-react';
import Link from 'next/link';

export default function OrderConfirmationPage() {
  const params = useParams();
  const id = params?.id as string;
  const [order, setOrder] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      api.get(`/orders/${id}`)
        .then(res => setOrder(res.data))
        .catch(() => setOrder(null))
        .finally(() => setLoading(false));
    }
  }, [id]);

  if (loading) return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  if (!order) return <div className="min-h-screen flex items-center justify-center">Order not found</div>;

  return (
    <>
      <Header />
      <main className="py-16">
        <div className="container mx-auto px-4 max-w-2xl text-center">
          <div className="flex justify-center mb-6">
            <CheckCircle size={80} className="text-green-500" />
          </div>
          <h1 className="text-4xl font-playfair font-bold mb-2">Order Placed! 🎉</h1>
          <p className="text-muted-foreground mb-4">Thank you for your order. We'll send you a confirmation email shortly.</p>
          <p className="text-sm bg-secondary/30 p-4 rounded-xl inline-block text-left">
            Order ID: {order.id} <br />
            Total Amount: ${Number(order.total).toFixed(2)} <br />
            Payment Status: {order.status === 'paid' ? 'Paid' : 'Pending (COD)'}
          </p>
          <div className="mt-8 space-x-4">
            <Link href="/en/products">
              <button className="px-8 py-3 bg-primary text-white rounded-full hover:bg-primary/90 transition cursor-pointer">
                Continue Shopping
              </button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
