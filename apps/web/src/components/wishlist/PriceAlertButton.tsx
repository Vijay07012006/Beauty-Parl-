'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import { Bell, BellRing, X } from 'lucide-react';

interface PriceAlertButtonProps {
  productId: number;
  currentPrice: number;
  className?: string;
}

export function PriceAlertButton({ productId, currentPrice, className = '' }: PriceAlertButtonProps) {
  const { user } = useAuthStore();

  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeAlert, setActiveAlert] = useState<any>(null);
  const [threshold, setThreshold] = useState<string>(String(Math.floor(currentPrice * 0.9))); // default to 10% discount threshold

  const fetchAlertStatus = async () => {
    if (!user || !productId) return;
    try {
      const res = await api.get('/wishlist-alerts');
      const alerts = Array.isArray(res.data) ? res.data : [];
      const found = alerts.find((a: any) => a.productId === productId && a.alertType === 'price_drop');
      if (found) {
        setActiveAlert(found);
        setThreshold(String(found.priceThreshold));
      } else {
        setActiveAlert(null);
      }
    } catch {}
  };

  useEffect(() => {
    fetchAlertStatus();
  }, [productId, user]);

  const handleSetAlert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error('Please sign in to set price alerts');
      return;
    }

    const priceVal = Number(threshold);
    if (isNaN(priceVal) || priceVal <= 0) {
      toast.error('Please enter a valid price threshold');
      return;
    }

    if (priceVal >= currentPrice) {
      toast.error('Threshold price must be lower than the current price');
      return;
    }

    setLoading(true);
    try {
      await api.post('/wishlist-alerts', {
        productId,
        alertType: 'price_drop',
        priceThreshold: priceVal,
      });
      toast.success(`Price drop alert set for $${priceVal.toFixed(2)}!`);
      setIsOpen(false);
      fetchAlertStatus();
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to set price alert');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAlert = async () => {
    if (!activeAlert) return;
    setLoading(true);
    try {
      await api.delete(`/wishlist-alerts/${activeAlert.id}`);
      toast.success('Price drop alert removed');
      setActiveAlert(null);
      setIsOpen(false);
    } catch (err: any) {
      toast.error('Failed to remove price alert');
    } finally {
      setLoading(false);
    }
  };

  if (!user) return null;

  return (
    <div className="relative inline-block">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setIsOpen(!isOpen);
        }}
        className={`p-2 rounded-full border transition-all flex items-center justify-center cursor-pointer ${
          activeAlert
            ? 'bg-primary/10 border-primary text-primary hover:bg-primary/20'
            : 'bg-card border-border hover:border-primary/50 text-muted-foreground hover:text-foreground'
        } ${className}`}
        title={activeAlert ? 'Price alert set' : 'Set price drop alert'}
      >
        {activeAlert ? <BellRing size={14} className="animate-pulse" /> : <Bell size={14} />}
      </button>

      {isOpen && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute right-0 mt-2 p-4 bg-card border border-border shadow-xl rounded-2xl z-50 min-w-[220px] space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-foreground">Set Price Drop Alert</span>
            <button
              onClick={() => setIsOpen(false)}
              className="text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <X size={14} />
            </button>
          </div>

          <p className="text-[10px] text-muted-foreground">
            Current Price: <span className="font-bold text-foreground">${currentPrice.toFixed(2)}</span>. We'll email you when the price drops below:
          </p>

          <form onSubmit={handleSetAlert} className="space-y-2">
            <div className="relative flex items-center">
              <span className="absolute left-3 text-xs text-muted-foreground">$</span>
              <input
                type="number"
                value={threshold}
                onChange={(e) => setThreshold(e.target.value)}
                required
                className="w-full pl-6 pr-3 py-1.5 rounded-xl border border-input bg-background text-xs focus:ring-1 focus:ring-primary focus:outline-none"
              />
            </div>

            <div className="flex gap-2 pt-1">
              {activeAlert && (
                <button
                  type="button"
                  onClick={handleDeleteAlert}
                  disabled={loading}
                  className="flex-1 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 text-[10px] font-bold rounded-lg border border-red-200 transition cursor-pointer"
                >
                  Remove
                </button>
              )}
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-1.5 bg-primary text-white text-[10px] font-bold rounded-lg hover:bg-primary/95 transition cursor-pointer"
              >
                {loading ? 'Saving...' : activeAlert ? 'Update' : 'Set Alert'}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
