'use client';

import { useState, useEffect } from 'react';

interface AddressFormProps {
  address?: any;
  onSubmit: (data: any) => void;
  onCancel: () => void;
  loading?: boolean;
}

export function AddressForm({ address, onSubmit, onCancel, loading }: AddressFormProps) {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    isDefault: false,
  });

  useEffect(() => {
    if (address) {
      setFormData({
        name: address.name || '',
        phone: address.phone || '',
        address: address.address || '',
        city: address.city || '',
        state: address.state || '',
        pincode: address.pincode || '',
        isDefault: address.isDefault || false,
      });
    }
  }, [address]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Full Name</label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            required
            placeholder="John Doe"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Phone Number</label>
          <input
            type="tel"
            value={formData.phone}
            onChange={(e) => setFormData({...formData, phone: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            required
            placeholder="9876543210"
          />
        </div>
      </div>

      <div className="space-y-1">
        <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Address Details</label>
        <textarea
          rows={3}
          value={formData.address}
          onChange={(e) => setFormData({...formData, address: e.target.value})}
          className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all resize-none"
          required
          placeholder="Flat / House no, Street, Locality"
        />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">City</label>
          <input
            type="text"
            value={formData.city}
            onChange={(e) => setFormData({...formData, city: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            required
            placeholder="Mumbai"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">State</label>
          <input
            type="text"
            value={formData.state}
            onChange={(e) => setFormData({...formData, state: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            required
            placeholder="Maharashtra"
          />
        </div>
        <div className="space-y-1">
          <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Pincode</label>
          <input
            type="text"
            value={formData.pincode}
            onChange={(e) => setFormData({...formData, pincode: e.target.value})}
            className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all"
            required
            placeholder="400001"
          />
        </div>
      </div>

      <div className="flex items-center gap-2 pt-1">
        <input
          type="checkbox"
          id="isDefault"
          checked={formData.isDefault}
          onChange={(e) => setFormData({...formData, isDefault: e.target.checked})}
          className="w-4 h-4 text-primary rounded border-input focus:ring-primary/40 accent-primary cursor-pointer"
        />
        <label htmlFor="isDefault" className="text-xs text-foreground font-semibold cursor-pointer select-none">
          Set as default shipping address
        </label>
      </div>

      <div className="flex gap-3 pt-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 py-3 bg-primary text-white rounded-full hover:bg-primary/95 transition font-bold text-sm disabled:opacity-60 active:scale-95 cursor-pointer select-none"
        >
          {loading ? 'Saving...' : address ? 'Update Address' : 'Add Address'}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 bg-secondary text-foreground rounded-full hover:bg-secondary/80 transition font-bold text-sm active:scale-95 cursor-pointer select-none"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
