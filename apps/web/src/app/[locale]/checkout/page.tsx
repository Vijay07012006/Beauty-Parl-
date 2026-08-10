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
import { CouponInput } from '@/components/checkout/CouponInput';
import { toast } from 'sonner';

export default function CheckoutPage() {
  const router = useRouter();
  const params = useParams();
  const locale = params?.locale || 'en';
  
  const { items, total, clearCart } = useCartStore();
  const { user, token } = useAuthStore();

  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [addresses, setAddresses] = useState<any[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<number | null>(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
  });
  const [paymentMethod, setPaymentMethod] = useState<'cod' | 'razorpay' | 'stripe'>('cod');
  const [error, setError] = useState('');

  useEffect(() => {
    setMounted(true);
    // Prefill shipping address from last used address for guest checkout convenience
    if (!user) {
      const savedAddress = localStorage.getItem('last_used_address');
      if (savedAddress) {
        try {
          const parsed = JSON.parse(savedAddress);
          setForm((prev) => ({
            ...prev,
            ...parsed,
          }));
        } catch {}
      }
    }
  }, [user]);

  // Fetch saved addresses if logged in
  useEffect(() => {
    if (user && token) {
      const headers = { Authorization: `Bearer ${token}` };
      api.get('/loyalty/points', { headers })
        .then(res => setPoints(res.data.points || 0))
        .catch(() => {});

      api.get('/addresses')
        .then(res => {
          const list = Array.isArray(res.data) ? res.data : [];
          setAddresses(list);
          const defaultAddress = list.find((a: any) => a.isDefault);
          if (defaultAddress) {
            setSelectedAddressId(defaultAddress.id);
            setForm({
              name: defaultAddress.name || user.name || '',
              email: user.email || '',
              phone: defaultAddress.phone || '',
              address: defaultAddress.address || '',
              city: defaultAddress.city || '',
              state: defaultAddress.state || '',
              pincode: defaultAddress.pincode || '',
            });
          }
        })
        .catch(err => {
          console.error('Failed to load user addresses', err);
        });
    }
  }, [user, token]);

  useEffect(() => {
    if (user && !selectedAddressId) {
      setForm(f => ({
        ...f,
        name: f.name || user.name || '',
        email: f.email || user.email || '',
      }));
    }
  }, [user, selectedAddressId]);

  const [coupon, setCoupon] = useState<any>(null);
  const [discountAmount, setDiscountAmount] = useState(0);
  const [points, setPoints] = useState(0);
  const [usePoints, setUsePoints] = useState(false);

  useEffect(() => {
    if (mounted && items.length === 0) {
      router.push(`/${locale}/cart`);
    }
  }, [items, router, mounted, locale]);

  const getSubtotal = () => useCartStore.getState().subtotal();
  const getTax = () => getSubtotal() * 0.1;
  const getShipping = () => (getSubtotal() > 50 ? 0 : 5);
  const getGrandTotal = () => {
    const baseTotal = getSubtotal() + getTax() + getShipping();
    const ptsDiscount = usePoints ? Math.min(points, getSubtotal()) : 0;
    const finalTotal = baseTotal - discountAmount - ptsDiscount;
    return finalTotal > 0 ? finalTotal : 0;
  };

  const handleCouponApplied = (result: any) => {
    setCoupon(result.coupon);
    setDiscountAmount(result.discount);
  };

  const handleCouponRemoved = () => {
    setCoupon(null);
    setDiscountAmount(0);
  };

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
      subtotal: getSubtotal(),
      tax: getTax(),
      shipping: getShipping(),
      total: getGrandTotal(),
      couponCode: coupon?.code || null,
      discount: discountAmount,
      pointsRedeemed: usePoints ? Math.min(points, Math.round(getSubtotal())) : 0,
      paymentMethod,
      shippingAddress: form,
      status: 'pending' as const,
    };

    if (paymentMethod === 'stripe') {
      try {
        // 1. Create order on the database first
        const orderRes = await api.post('/orders', orderData);
        const orderId = orderRes.data.id;

        // 2. Create Stripe checkout session
        const stripeSessionRes = await api.post('/payments/create-stripe-session', {
          amount: orderData.total,
          orderId: orderId,
          currency: 'INR',
        });

        // 3. Save last used address
        localStorage.setItem('last_used_address', JSON.stringify(form));
        clearCart();

        // 4. Redirect user to Stripe Checkout page
        window.location.href = stripeSessionRes.data.url;
      } catch (err: any) {
        setError(err.response?.data?.message || 'Failed to initiate Stripe payment. Please try again.');
        setLoading(false);
      }
    } else if (paymentMethod === 'razorpay') {
      try {
        // 1. Create order on the database first (in 'pending' state)
        const orderRes = await api.post('/orders', orderData);
        const orderId = orderRes.data.id;

        // 2. Generate Razorpay order on backend (passing DB orderId)
        const razorpayOrderRes = await api.post('/payments/create-order', {
          amount: orderData.total,
          orderId: orderId,
        });
        const { id: razorpayOrderId, keyId } = razorpayOrderRes.data;

        // 3. Setup Razorpay options
        const options = {
          key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
          amount: Math.round(orderData.total * 100), // in paise
          currency: 'INR',
          name: 'Beauty Parlé',
          description: `Order #${orderId}`,
          order_id: razorpayOrderId,
          handler: function (response: any) {
            // Payment success → redirect to confirmation page with details
            localStorage.setItem('last_used_address', JSON.stringify(form));
            clearCart();
            router.push(`/${locale}/order-confirmation/${orderId}?payment=success&payment_id=${response.razorpay_payment_id}&email=${form.email}`);
          },
          prefill: {
            name: form.name,
            email: form.email,
            contact: form.phone,
          },
          theme: {
            color: '#E8A0BF',
          },
          modal: {
            ondismiss: function () {
              setLoading(false);
              // Payment cancelled / modal closed → redirect back to checkout to retry
              router.push(`/${locale}/checkout`);
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
        localStorage.setItem('last_used_address', JSON.stringify(form));
        clearCart();
        router.push(`/${locale}/order-confirmation/${res.data.id}?email=${form.email}`);
      } catch (err) {
        setError('Failed to place order. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleExpressCheckout = async () => {
    // 1. Verify if address is filled. If not, try to prefill from localStorage.
    let activeForm = { ...form };
    const hasAddress = activeForm.name && activeForm.email && activeForm.phone && activeForm.address && activeForm.city && activeForm.state && activeForm.pincode;

    if (!hasAddress) {
      const savedAddress = localStorage.getItem('last_used_address');
      if (savedAddress) {
        try {
          const parsed = JSON.parse(savedAddress);
          activeForm = { ...activeForm, ...parsed };
          setForm(activeForm);
          toast.success('Address auto-completed from your previous order!');
        } catch {
          toast.error('Please enter your shipping address details first.');
          return;
        }
      } else {
        toast.error('Please enter your shipping address details first.');
        return;
      }
    }

    setLoading(true);
    setError('');

    const orderData = {
      userId: user?.id || null,
      guestEmail: user ? null : activeForm.email,
      items: items.map(i => ({
        productId: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image: i.image,
      })),
      subtotal: getSubtotal(),
      tax: getTax(),
      shipping: getShipping(),
      total: getGrandTotal(),
      couponCode: coupon?.code || null,
      discount: discountAmount,
      pointsRedeemed: usePoints ? Math.min(points, Math.round(getSubtotal())) : 0,
      paymentMethod: 'razorpay' as const,
      shippingAddress: activeForm,
      status: 'pending' as const,
    };

    try {
      // 1. Create order
      const orderRes = await api.post('/orders', orderData);
      const orderId = orderRes.data.id;

      // 2. Create Razorpay order
      const rzpOrderRes = await api.post('/payments/create-order', {
        amount: orderData.total,
        orderId,
      });
      const { id: rzpOrderId, keyId } = rzpOrderRes.data;

      // 3. Trigger Razorpay modal with UPI prefilled
      const options = {
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || keyId,
        amount: Math.round(orderData.total * 100),
        currency: 'INR',
        name: 'Beauty Parlé',
        description: `Express Checkout #${orderId}`,
        order_id: rzpOrderId,
        handler: function (response: any) {
          localStorage.setItem('last_used_address', JSON.stringify(activeForm));
          clearCart();
          router.push(`/${locale}/order-confirmation/${orderId}?payment=success&payment_id=${response.razorpay_payment_id}&email=${activeForm.email}`);
        },
        prefill: {
          name: activeForm.name,
          email: activeForm.email,
          contact: activeForm.phone,
          method: 'upi', // Pre-fill UPI for express payment methods
        },
        theme: {
          color: '#E8A0BF',
        },
        modal: {
          ondismiss: function () {
            setLoading(false);
            router.push(`/${locale}/checkout`);
          },
        },
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error('Express checkout error:', err);
      setError(err?.response?.data?.message || 'Express checkout initiation failed. Please try again.');
      setLoading(false);
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
      <Script
        id="razorpay-checkout"
        src="https://checkout.razorpay.com/v1/checkout.js"
        strategy="afterInteractive"
      />
      
      <main className="py-12">
        <div className="container mx-auto px-4 max-w-5xl">
          <h1 className="text-4xl font-playfair font-bold mb-8">Checkout</h1>

          <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Shipping Form */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50">
                <h2 className="text-xl font-semibold mb-4">Shipping Address</h2>
                <div className="space-y-4">
                  {addresses.length > 0 && (
                    <div className="space-y-1.5 pb-2">
                      <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Select Saved Address</label>
                      <select
                        value={selectedAddressId || ''}
                        onChange={(e) => {
                          const id = Number(e.target.value);
                          setSelectedAddressId(id);
                          const address = addresses.find((a: any) => a.id === id);
                          if (address) {
                            setForm({
                              name: address.name || '',
                              email: user?.email || form.email || '',
                              phone: address.phone || '',
                              address: address.address || '',
                              city: address.city || '',
                              state: address.state || '',
                              pincode: address.pincode || '',
                            });
                          }
                        }}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all cursor-pointer font-medium"
                      >
                        <option value="">Choose a saved address...</option>
                        {addresses.map((address: any) => (
                          <option key={address.id} value={address.id}>
                            {address.name} - {address.city}, {address.state} {address.isDefault ? '(Default)' : ''}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}

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
                  <label className="flex items-center gap-3 p-3 rounded-xl border border-border hover:bg-secondary/50 transition cursor-pointer">
                    <input
                      type="radio"
                      name="payment"
                      value="stripe"
                      checked={paymentMethod === 'stripe'}
                      onChange={() => setPaymentMethod('stripe')}
                      className="text-primary focus:ring-primary"
                    />
                    <span>Stripe (Card / Apple Pay / Google Pay)</span>
                  </label>
                </div>
              </div>

              {error && <div className="text-red-500 text-sm font-medium">{error}</div>}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-primary text-white rounded-full hover:bg-primary/95 transition font-bold disabled:opacity-70 cursor-pointer shadow-md shadow-primary/20"
              >
                {loading ? 'Processing...' : `Place Order — $${getGrandTotal().toFixed(2)}`}
              </button>

              <button
                type="button"
                onClick={handleExpressCheckout}
                disabled={loading}
                className="w-full mt-3 py-4 bg-neutral-900 text-white rounded-full hover:bg-neutral-800 transition font-bold disabled:opacity-70 cursor-pointer flex items-center justify-center gap-2 shadow-md shadow-black/25"
              >
                ⚡ Express Checkout (GPay / Apple Pay / UPI)
              </button>
            </div>

            {/* Order Summary & Coupon */}
            <div className="lg:col-span-1 space-y-6">
              {/* Coupon Input Block */}
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 space-y-4">
                <h2 className="text-lg font-playfair font-bold text-foreground">Promo Code</h2>
                <CouponInput
                  onCouponApplied={handleCouponApplied}
                  onCouponRemoved={handleCouponRemoved}
                  orderTotal={getSubtotal()}
                />
              </div>

              {/* Redeem Points Card */}
              {user && points > 0 && (
                <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 space-y-3">
                  <h2 className="text-sm font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    ⭐ Loyalty Points
                  </h2>
                  <label className="flex items-center gap-2.5 p-2 bg-secondary/15 rounded-xl border border-border/20 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={usePoints}
                      onChange={(e) => setUsePoints(e.target.checked)}
                      className="rounded border-gray-300 text-primary focus:ring-primary w-4.5 h-4.5 cursor-pointer"
                    />
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-foreground">Redeem points for discount</span>
                      <p className="text-[10px] text-muted-foreground">
                        Use {Math.min(points, Math.round(getSubtotal()))} of your {points} points to save Rs. {Math.min(points, Math.round(getSubtotal()))}
                      </p>
                    </div>
                  </label>
                </div>
              )}

              {/* Summary Card */}
              <div className="bg-card p-6 rounded-2xl shadow-sm border border-border/50 sticky top-24 space-y-4">
                <h2 className="text-xl font-playfair font-bold text-foreground">Order Summary</h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Items ({useCartStore.getState().totalItems()})</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Shipping</span>
                    <span>{getShipping() === 0 ? 'Free' : `$${getShipping().toFixed(2)}`}</span>
                  </div>
                  <div className="flex justify-between text-muted-foreground font-medium">
                    <span>Tax (10%)</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  
                  {coupon && (
                    <div className="flex justify-between text-emerald-600 font-bold bg-emerald-50/50 px-2 py-1 rounded-lg border border-emerald-100 text-xs items-center">
                      <span>Promo ({coupon.code})</span>
                      <span>-${discountAmount.toFixed(2)}</span>
                    </div>
                  )}

                  {usePoints && (
                    <div className="flex justify-between text-amber-600 font-bold bg-amber-50/50 px-2 py-1 rounded-lg border border-amber-100 text-xs items-center">
                      <span>Points Redeemed</span>
                      <span>-Rs. {Math.min(points, Math.round(getSubtotal())).toFixed(2)}</span>
                    </div>
                  )}

                  <div className="border-t border-border/40 pt-3 flex justify-between font-bold text-lg text-foreground">
                    <span>Total</span>
                    <span className="text-primary">${getGrandTotal().toFixed(2)}</span>
                  </div>
                </div>
                
                <div className="mt-4 max-h-40 overflow-y-auto space-y-2 border-t border-border/40 pt-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 text-xs text-muted-foreground" style={{ minHeight: '32px' }}>
                      <span className="w-8 h-8 relative rounded-lg overflow-hidden flex-shrink-0 bg-secondary/20 block">
                        {item.image ? (
                          <Image src={item.image} alt="" fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px]">💄</div>
                        )}
                      </span>
                      <span className="flex-1 truncate font-medium text-foreground">{item.name}</span>
                      <span className="font-semibold">x{item.quantity}</span>
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
