'use client';

import { useState } from 'react';
import { Edit2, Trash2, MapPin, Check, Star } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';

interface Address {
  id: number;
  name: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  isDefault: boolean;
}

interface AddressListProps {
  addresses: Address[];
  onEdit: (address: Address) => void;
  onDelete: (id: number) => void;
  onRefresh: () => void;
}

export function AddressList({ addresses, onEdit, onDelete, onRefresh }: AddressListProps) {
  const [loading, setLoading] = useState<number | null>(null);

  const setDefault = async (id: number) => {
    setLoading(id);
    try {
      await api.put(`/addresses/${id}/default`);
      toast.success('Default address updated!');
      onRefresh();
    } catch (error) {
      console.error('Failed to set default address:', error);
      toast.error('Failed to update default address');
    } finally {
      setLoading(null);
    }
  };

  if (addresses.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <MapPin size={48} className="mx-auto text-muted-foreground/30 animate-bounce" />
        <div>
          <p className="font-bold text-foreground">No saved addresses</p>
          <p className="text-xs text-muted-foreground mt-1">Add your shipping details to enable fast checkout</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {addresses.map((address) => (
        <div
          key={address.id}
          className={`p-5 rounded-2xl border transition-all duration-300 ${
            address.isDefault
              ? 'border-primary/40 bg-primary/5 shadow-sm'
              : 'border-border/50 bg-card hover:border-primary/20 shadow-[0_2px_8px_-3px_rgba(0,0,0,0.05)]'
          }`}
        >
          <div className="flex items-start justify-between">
            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-semibold text-foreground text-sm">{address.name}</p>
                {address.isDefault && (
                  <span className="flex items-center gap-1 text-[9px] font-bold tracking-wider uppercase bg-primary/15 text-primary px-2.5 py-0.5 rounded-full border border-primary/20">
                    <Star size={10} className="fill-primary text-primary" />
                    Default
                  </span>
                )}
              </div>
              <p className="text-xs font-semibold text-muted-foreground">📞 {address.phone}</p>
              <p className="text-xs leading-relaxed text-muted-foreground/90 max-w-md">
                {address.address}, {address.city}, {address.state} - <span className="font-bold text-foreground/80">{address.pincode}</span>
              </p>
            </div>
            
            <div className="flex gap-1 ml-4 items-center shrink-0">
              <button
                onClick={() => onEdit(address)}
                className="p-2 text-blue-500 hover:bg-blue-50 rounded-full transition-colors cursor-pointer"
                aria-label="Edit address"
              >
                <Edit2 size={16} />
              </button>
              
              {!address.isDefault && (
                <button
                  onClick={() => setDefault(address.id)}
                  disabled={loading === address.id}
                  className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-full transition-colors disabled:opacity-50 cursor-pointer"
                  aria-label="Set default"
                  title="Make Default Address"
                >
                  <Check size={16} />
                </button>
              )}
              
              <button
                onClick={() => onDelete(address.id)}
                className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors cursor-pointer"
                aria-label="Delete address"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
