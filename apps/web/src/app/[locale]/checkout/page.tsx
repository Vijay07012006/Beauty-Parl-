'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import Image from 'next/image';
import Script from 'next/script';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';
  
  const { items, total, clearCart } = useCartStore();
  const { user } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay'>('cod');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
      setForm(f => ({
        ...f,
        name: f.name || user.name || '',
        email: f.email || user.email || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [items, router, mounted, locale]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const orderData = {
      userId: user?.id || null,
      guestEmail: user ? null : form.email,
      items: items.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: useCartStore.getState().subtotal(),
      tax: useCartStore.getState().subtotal() * 0.1,
      shipping: useCartStore.getState().subtotal() > 50 ? 0 : 5,
      total: useCartStore.getState().total(),
      paymentMethod,
      shippingAddress: form,
    };

    if (paymentMethod === 'razorpay') {
      try {
        // 1. Create order on Razorpay backend
        const razorpayOrderRes = await api.post('/payments/create-order', { amount: orderData.total });
        const { id: razorpayOrderId, keyId } = razorpayOrderRes.data;

        // 2. Setup Razorpay options
        const options = {
          key: keyId,
          amount: Math.round(orderData.total * 100),
          currency: 'INR',
          name: 'Beauty Parlé',
          description: 'Payment for your Beauty Parlé order',
          order_id: razorpayOrderId,
          handler: async function (response: any) {
            // Payment success handler
            const finalOrderData = {
              ...orderData,
              paymentId: response.razorpay_payment_id,
              status: 'paid',
            };

            try {
              const res = await api.post('/orders', finalOrderData);
              clearCart();
              router.push(`/${locale}/order-confirmation/${res.data.id}`);
            } catch (err) {
              setError('Payment succeeded, but order registration failed. Please contact support.');
            } finally {
              setLoading(false);
            }
          },
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          theme: {
            color: '#F43F5E', // primary rose color matching theme
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
            },
          },
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          setError(response.error.description || 'Payment failed. Please try again.');
          setLoading(false);
        });
        rzp.open();

      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initiate Razorpay payment. Please try again.');
        setLoading(false);
      }
    } else {
      // Cash on Delivery path
      try {
        const res = await api.post('/orders', orderData);
        clearCart();
        router.push(`/${locale}/order-confirmation/${res.data.id}`);
      } catch (err) {
        setError('Failed to place order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  if (!mounted) {
    return (
      <>
        <Header />
        <main className="min-h-screen flex items-center justify-center">
          <div className="animate-pulse">Loading checkout...</div>
        </main>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Header />
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
      
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-playfair font-bold mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Full Name</label>
                      <input
                        type="text"
                        required
                        value={form.name}
                        onChange={(e) => setForm({...form, name: e.target.value})}
                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Email</label>
                      <input
                        type="email"
                        required
                        value={form.email}
                        onChange={(e) => setForm({...form, email: e.target.value})}
                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Phone</label>
                    <input
                      type="tel"
                      required
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Address</label>
                    <input
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({...form, address: e.target.value})}
                      className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                    />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">City</label>
                      <input
                        type="text"
                        required
                        value={form.city}
                        onChange={(e) => setForm({...form, city: e.target.value})}
                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">State</label>
                      <input
                        type="text"
                        required
                        value={form.state}
                        onChange={(e) => setForm({...form, state: e.target.value})}
                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Pincode</label>
                      <input
                        type="text"
                        required
                        value={form.pincode}
                        onChange={(e) => setForm({...form, pincode: e.target.value})}
                        className="w-full p-3 rounded-xl border border-input bg-background focus:ring-2 focus:ring-primary/50"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Method */}
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                <h2 className="text-xl font-semibold mb-4">Payment Method</h2>
                <div className="space-y-3">
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="cod"
                      checked={paymentMethod === 'cod'}
                      onChange={() => setPaymentMethod('cod')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Cash on Delivery (COD)</span>
                  </label>
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="razorpay"
                      checked={paymentMethod === 'razorpay'}
                      onChange={() => setPaymentMethod('razorpay')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Razorpay (UPI / Cards / NetBanking)</span>
                  </label>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-full hover:bg-primary/90 transition font-bold disabled:opacity-70 cursor-pointer"
              >
                {loading ? 'Processing...' : `Place Order — $${total().toFixed(2)}`}
              </button>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <div className="bg-card p-6 rounded-2xl shadow-md border border-border/50 sticky top-24">
                <h2 className="text-xl font-playfair font-bold mb-4">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span>Items ({useCartStore.getState().totalItems()})</span>
                    <span>${useCartStore.getState().subtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Shipping</span>
                    <span>{useCartStore.getState().subtotal() > 50 ? 'Free' : '$5.00'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Tax (10%)</span>
                    <span>${(useCartStore.getState().subtotal() * 0.1).toFixed(2)}</span>
                  </div>
                  <div className="border-t border-border pt-3 flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span>${total().toFixed(2)}</span>
                  </div>
                </div>
                <div className="mt-4 max-h-40 overflow-y-auto space-y-2">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-sm" style={{ minHeight: '32px' }}>
                      <span className="w-8 h-8 relative rounded overflow-hidden flex-shrink-0 bg-secondary/20 block">
                        {item.image ? (
                          <Image src={item.image} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs">💄</div>
                        )}
                      </span>
                      <span className="flex-1 truncate">{item.name}</span>
                      <span className="text-muted-foreground">x{item.quantity}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </form>
        </div>
      </main>
      <Footer />
    </>
  );
}
