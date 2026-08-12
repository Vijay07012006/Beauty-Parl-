'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { Mail, Bell, Megaphone, Send, ArrowLeft, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { useWishlistStore } from '@/store/wishlistStore';
import Link from 'next/link';

interface Preferences {
  marketing: boolean;
  order_updates: boolean;
  newsletter: boolean;
  promotional: boolean;
}

export default function EmailPreferencesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [preferences, setPreferences] = useState<Preferences>({
    marketing: true,
    order_updates: true,
    newsletter: false,
    promotional: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Wishlist Alerts states
  const [alerts, setAlerts] = useState<any[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);
  const [selectedProductId, setSelectedProductId] = useState<string>('');
  const [alertType, setAlertType] = useState<'price_drop' | 'back_in_stock'>('price_drop');
  const [threshold, setThreshold] = useState<string>('');
  const [addingAlert, setAddingAlert] = useState(false);

  const wishlistItems = useWishlistStore((state) => state.items);

  const fetchAlerts = async () => {
    setLoadingAlerts(true);
    try {
      const response = await api.get('/wishlist-alerts');
      setAlerts(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch wishlist alerts:', error);
    } finally {
      setLoadingAlerts(false);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchPreferences();
    fetchAlerts();
  }, [user, locale]);

  const fetchPreferences = async () => {
    setLoading(true);
    try {
      const response = await api.get('/auth/preferences');
      if (response.data) {
        setPreferences(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch preferences:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (key: keyof Preferences) => {
    setPreferences(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await api.put('/auth/preferences', preferences);
      toast.success('Preferences saved successfully!');
    } catch (error) {
      toast.error('Failed to save preferences. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleAddAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId) {
      toast.error('Please select an item from your wishlist');
      return;
    }
    if (alertType === 'price_drop' && !threshold) {
      toast.error('Please specify a target price drop threshold');
      return;
    }

    setAddingAlert(true);
    try {
      const payload = {
        productId: Number(selectedProductId),
        alertType,
        priceThreshold: alertType === 'price_drop' ? Number(threshold) : undefined,
      };
      await api.post('/wishlist-alerts', payload);
      toast.success('Wishlist alert configured successfully! 🔔');
      setSelectedProductId('');
      setThreshold('');
      fetchAlerts();
    } catch (err: any) {
      toast.error(err?.response?.data?.message || 'Failed to configure alert');
    } finally {
      setAddingAlert(false);
    }
  };

  const handleDeleteAlert = async (alertId: number) => {
    try {
      await api.delete(`/wishlist-alerts/${alertId}`);
      toast.success('Alert deleted');
      fetchAlerts();
    } catch (err) {
      toast.error('Failed to delete alert');
    }
  };

  const preferenceOptions = [
    {
      key: 'order_updates' as keyof Preferences,
      icon: Bell,
      title: 'Order Updates',
      description: 'Get notified about order confirmations, shipping updates, and delivery status',
    },
    {
      key: 'marketing' as keyof Preferences,
      icon: Megaphone,
      title: 'Marketing Emails',
      description: 'Receive exclusive offers, new product announcements, and beauty tips',
    },
    {
      key: 'newsletter' as keyof Preferences,
      icon: Mail,
      title: 'Newsletter',
      description: 'Weekly newsletter with curated beauty content and trends',
    },
    {
      key: 'promotional' as keyof Preferences,
      icon: Send,
      title: 'Promotional Offers',
      description: 'Special discount codes and flash sale notifications',
    },
  ];

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-2xl">
            <div className="animate-pulse space-y-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="bg-card rounded-3xl h-24 border border-border/50" />
              ))}
            </div>
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
        <div className="container mx-auto px-4 max-w-2xl space-y-6">
          <Link
            href={`/${locale}/profile`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors uppercase tracking-wider"
          >
            <ArrowLeft size={14} />
            Back to Profile
          </Link>

          <div>
            <h1 className="text-3xl font-playfair font-bold text-foreground">Email Preferences</h1>
            <p className="text-sm text-muted-foreground mt-1 font-medium">
              Manage what emails you receive from Beauty Parlé
            </p>
          </div>

          <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm space-y-6">
            <div className="space-y-4">
              {preferenceOptions.map(({ key, icon: Icon, title, description }) => (
                <div
                  key={key}
                  className="flex items-start justify-between p-4 rounded-2xl border border-border/50 hover:border-primary/20 bg-card/50 transition-all duration-300"
                >
                  <div className="flex gap-3">
                    <div className="p-2.5 bg-primary/10 rounded-xl">
                      <Icon size={18} className="text-primary" />
                    </div>
                    <div className="space-y-0.5">
                      <p className="font-semibold text-sm text-foreground">{title}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed max-w-md">{description}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleToggle(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors flex-shrink-0 mt-1 cursor-pointer ${
                      preferences[key] ? 'bg-primary' : 'bg-secondary'
                    }`}
                    aria-label={`Toggle ${title}`}
                  >
                    <span
                      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md transition-transform duration-300 ${
                        preferences[key] ? 'translate-x-5' : 'translate-x-0.5'
                      }`}
                    />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={handleSave}
              disabled={saving}
              className="w-full py-3 bg-primary text-white rounded-full font-semibold text-xs hover:bg-primary/90 transition-all active:scale-95 disabled:opacity-60 cursor-pointer"
            >
              {saving ? 'Saving...' : 'Save Preferences'}
            </button>
          </div>

          {/* Wishlist Alerts Panel */}
          <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm space-y-6">
            <div>
              <h2 className="text-xl font-playfair font-bold text-foreground">Wishlist Price & Stock Alerts</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Set price drop triggers or restock monitors for items in your wishlist. We will notify you via email!
              </p>
            </div>

            {/* Create Alert Form */}
            {wishlistItems.length === 0 ? (
              <div className="text-center py-4 bg-secondary/15 rounded-2xl border border-dashed border-border text-xs text-muted-foreground">
                Your wishlist is empty. Add products to wishlist first to set alerts!
              </div>
            ) : (
              <form onSubmit={handleAddAlert} className="space-y-4 bg-secondary/10 p-4 rounded-2xl border border-border/20">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Select Product</label>
                    <select
                      value={selectedProductId}
                      onChange={(e) => setSelectedProductId(e.target.value)}
                      className="w-full bg-card border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="">-- Choose item --</option>
                      {wishlistItems.map((item) => (
                        <option key={item.id} value={item.id}>{item.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Alert Type</label>
                    <select
                      value={alertType}
                      onChange={(e) => setAlertType(e.target.value as any)}
                      className="w-full bg-card border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    >
                      <option value="price_drop">Price Drop Trigger</option>
                      <option value="back_in_stock">Back in Stock Monitor</option>
                    </select>
                  </div>
                </div>

                {alertType === 'price_drop' && (
                  <div className="space-y-1 max-w-[200px]">
                    <label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Target Price (Rs.)</label>
                    <input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="e.g. 999"
                      className="w-full bg-card border border-border/50 rounded-xl px-3 py-2 text-xs focus:outline-none"
                    />
                  </div>
                )}

                <button
                  type="submit"
                  disabled={addingAlert}
                  className="w-full py-2.5 bg-neutral-900 text-white rounded-xl font-semibold text-xs hover:bg-neutral-850 transition cursor-pointer"
                >
                  {addingAlert ? 'Configuring Alert...' : 'Add Alert Notification'}
                </button>
              </form>
            )}

            {/* Active Alerts List */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Active Monitored Alerts ({alerts.length})</h3>
              {loadingAlerts ? (
                <div className="text-center text-xs text-muted-foreground animate-pulse">Loading configured alerts...</div>
              ) : alerts.length === 0 ? (
                <div className="text-center py-6 text-xs text-muted-foreground">No active price drop or restock alerts configured</div>
              ) : (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {alerts.map((alert) => (
                    <div
                      key={alert.id}
                      className="flex items-center justify-between p-3.5 bg-card border border-border/30 rounded-2xl hover:border-primary/20 transition-all text-xs"
                    >
                      <div className="flex flex-col gap-0.5">
                        <span className="font-semibold text-foreground truncate max-w-[250px]">{alert.product?.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {alert.alertType === 'price_drop'
                            ? `📩 Price Drop: Notify below Rs. ${Number(alert.priceThreshold).toFixed(2)}`
                            : '📩 Restock: Notify when back in stock'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDeleteAlert(alert.id)}
                        className="p-1.5 hover:bg-secondary rounded-lg text-red-500 hover:text-red-700 transition cursor-pointer"
                        aria-label="Delete alert"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
