'use client';

import { useState } from 'react';

export function DeliveryChecker() {
  const [pincode, setPincode] = useState('');
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCheck = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPin = pincode.replace(/\D/g, '');
    if (cleanPin.length === 6) {
      // Mock logic based on pincode range
      const days = parseInt(cleanPin.substring(0, 2), 10) % 3 + 2; // 2 to 4 days
      setResult({
        success: true,
        message: `🚚 Delivery available! Expected in ${days} days. Free Delivery & Cash on Delivery (COD) eligible.`
      });
    } else {
      setResult({
        success: false,
        message: '❌ Please enter a valid 6-digit pincode.'
      });
    }
  };

  return (
    <div className="p-4 bg-secondary/20 rounded-2xl border border-border/50 space-y-3">
      <h4 className="text-sm font-semibold text-foreground/80 flex items-center gap-1.5">
        <span>📍</span> Check Delivery Availability
      </h4>
      <form onSubmit={handleCheck} className="flex gap-2">
        <input
          type="text"
          maxLength={6}
          value={pincode}
          onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          placeholder="Enter 6-digit pincode"
          className="flex-1 px-3 py-2 text-sm rounded-xl border border-input bg-background focus:outline-none focus:ring-1 focus:ring-primary/50"
        />
        <button
          type="submit"
          className="px-4 py-2 text-xs font-bold bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors cursor-pointer select-none"
        >
          Check
        </button>
      </form>
      {result && (
        <p className={`text-xs font-medium ${result.success ? 'text-green-600' : 'text-red-500'}`}>
          {result.message}
        </p>
      )}
    </div>
  );
}
