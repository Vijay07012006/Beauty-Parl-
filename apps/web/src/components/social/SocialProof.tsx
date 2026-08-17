'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShoppingBag, Users } from 'lucide-react';

interface Purchase {
  name: string;
  location: string;
  product: string;
  timeAgo: string;
}

const mockPurchases: Purchase[] = [
  { name: 'Anjali', location: 'Mumbai', product: 'Matte Liquid Lipstick', timeAgo: '2 mins ago' },
  { name: 'Priya', location: 'New Delhi', product: 'Vitamin C Face Serum', timeAgo: '5 mins ago' },
  { name: 'Sneha', location: 'Bengaluru', product: 'Hydrating Rose Water Toner', timeAgo: '8 mins ago' },
  { name: 'Kiran', location: 'Hyderabad', product: 'Silk Eye Shadow Palette', timeAgo: '12 mins ago' },
  { name: 'Meera', location: 'Pune', product: 'Argan Oil Hair Mask', timeAgo: '15 mins ago' },
  { name: 'Riya', location: 'Chennai', product: 'Moisturizing Aloe Vera Gel', timeAgo: '19 mins ago' },
];

export function SocialProof() {
  const [purchaseIndex, setPurchaseIndex] = useState(0);
  const [showPurchase, setShowPurchase] = useState(false);
  const [visitors, setVisitors] = useState(15);

  useEffect(() => {
    // Randomize visitor count slightly to make it look active/live
    const visitorInterval = setInterval(() => {
      setVisitors(prev => {
        const delta = Math.floor(Math.random() * 5) - 2; // -2 to +2
        return Math.max(8, Math.min(35, prev + delta));
      });
    }, 8000);

    // Rotate purchases popup
    const purchaseInterval = setInterval(() => {
      setShowPurchase(false);
      setTimeout(() => {
        setPurchaseIndex((prev) => (prev + 1) % mockPurchases.length);
        setShowPurchase(true);
      }, 1000);
    }, 15000);

    // Show initial popup after 3 seconds
    const initialTimeout = setTimeout(() => {
      setShowPurchase(true);
    }, 3000);

    return () => {
      clearInterval(visitorInterval);
      clearInterval(purchaseInterval);
      clearTimeout(initialTimeout);
    };
  }, []);

  const currentPurchase = mockPurchases[purchaseIndex];

  return (
    <div className="fixed bottom-6 left-6 z-50 flex flex-col gap-3 pointer-events-none">
      {/* Live Visitors Count */}
      <div className="bg-neutral-900/90 backdrop-blur-md text-white border border-white/10 px-3.5 py-2 rounded-2xl flex items-center gap-2 text-[10px] font-bold shadow-lg pointer-events-auto w-fit">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
        </span>
        <Users className="w-3.5 h-3.5 text-primary" />
        <span>{visitors} beauty lovers shopping live</span>
      </div>

      {/* Recent Purchase Popup */}
      <AnimatePresence>
        {showPurchase && (
          <motion.div
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            className="bg-card border border-border/50 p-4 rounded-3xl shadow-xl flex items-center gap-3 max-w-[280px] pointer-events-auto"
          >
            <div className="w-9 h-9 bg-primary/10 rounded-full flex items-center justify-center text-primary shrink-0">
              <ShoppingBag className="w-4.5 h-4.5" />
            </div>
            <div className="space-y-0.5 min-w-0">
              <p className="text-[10px] font-semibold text-foreground truncate">
                {currentPurchase.name} from <span className="text-primary font-bold">{currentPurchase.location}</span>
              </p>
              <p className="text-[10px] text-muted-foreground truncate leading-relaxed">
                Bought <span className="font-bold text-foreground">{currentPurchase.product}</span>
              </p>
              <p className="text-[9px] text-muted-foreground font-mono">{currentPurchase.timeAgo}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
