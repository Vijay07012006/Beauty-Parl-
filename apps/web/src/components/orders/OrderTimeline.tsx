'use client';

import { CheckCircle, Package, Truck, Home, Clock, XCircle, CreditCard } from 'lucide-react';
import { cn } from '@/lib/utils';

interface OrderTimelineProps {
  status: 'pending' | 'paid' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: string;
}

const statusSteps = [
  { status: 'pending', label: 'Order Placed', icon: Clock },
  { status: 'processing', label: 'Processing', icon: Package },
  { status: 'shipped', label: 'Shipped', icon: Truck },
  { status: 'delivered', label: 'Delivered', icon: Home },
];

export function OrderTimeline({ status, createdAt }: OrderTimelineProps) {
  const isCancelled = status === 'cancelled';

  // Get index based on current status
  const getCurrentIndex = () => {
    switch (status) {
      case 'pending':
        return 0;
      case 'paid':
        // Paid is between pending and processing, so we highlight placed step
        return 0;
      case 'processing':
        return 1;
      case 'shipped':
        return 2;
      case 'delivered':
        return 3;
      default:
        return 0;
    }
  };

  const currentIndex = getCurrentIndex();

  if (isCancelled) {
    return (
      <div className="bg-card p-6 rounded-3xl border border-border/50 space-y-3 shadow-sm">
        <div className="flex items-center gap-3 text-red-500">
          <XCircle size={24} className="fill-red-50" />
          <span className="font-semibold text-base">Order Cancelled</span>
        </div>
        <p className="text-sm text-muted-foreground">
          This order has been cancelled. If you have already paid or need assistance, please contact our support team.
        </p>
      </div>
    );
  }

  return (
    <div className="bg-card p-6 rounded-3xl border border-border/50 shadow-sm space-y-6">
      <div className="relative">
        {/* Progress Bar Background Line */}
        <div className="absolute top-5 left-0 right-0 h-1 bg-secondary rounded-full overflow-hidden">
          <div
            className="h-full bg-primary transition-all duration-750 ease-out"
            style={{ width: `${(currentIndex / (statusSteps.length - 1)) * 100}%` }}
          />
        </div>

        {/* Steps */}
        <div className="relative flex justify-between">
          {statusSteps.map((step, index) => {
            const isActive = index <= currentIndex;
            const isCurrent = index === currentIndex;
            const Icon = step.icon;

            return (
              <div key={step.status} className="flex flex-col items-center flex-1">
                <div
                  className={cn(
                    "relative z-10 flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-500",
                    isActive
                      ? "border-primary bg-primary text-white"
                      : "border-secondary bg-background text-muted-foreground",
                    isCurrent && "ring-4 ring-primary/20 scale-110"
                  )}
                >
                  <Icon size={18} />
                </div>
                <p className={cn(
                  "text-[10px] md:text-xs font-semibold mt-2 text-center transition-colors",
                  isActive ? "text-foreground" : "text-muted-foreground",
                  isCurrent && "text-primary font-bold"
                )}>
                  {step.label}
                </p>
                {isCurrent && (
                  <span className="text-[9px] text-muted-foreground mt-1">
                    {new Date(createdAt).toLocaleDateString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Current Status Message Box */}
      <div className="p-4 bg-secondary/20 border border-border/30 rounded-2xl transition-all">
        <p className="text-sm font-semibold text-foreground">
          {status === 'delivered' 
            ? '🎉 Your order has been delivered successfully!' 
            : status === 'shipped'
            ? '🚚 Your order is on the way!'
            : status === 'processing'
            ? '🔄 Your order is being processed.'
            : status === 'paid'
            ? '💳 Payment confirmed. Preparing your package!'
            : '✅ Your order has been placed successfully.'}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Placed on {new Date(createdAt).toLocaleDateString('en-IN', {
            day: '2-digit',
            month: 'long',
            year: 'numeric',
          })}
        </p>
      </div>
    </div>
  );
}
