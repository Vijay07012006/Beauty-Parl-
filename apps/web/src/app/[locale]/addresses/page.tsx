'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { AddressForm } from '@/components/addresses/AddressForm';
import { AddressList } from '@/components/addresses/AddressList';
import { api } from '@/lib/api';
import { Plus, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function AddressesPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user, token } = useAuthStore();
  const [addresses, setAddresses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState<any>(null);
  const [formLoading, setFormLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchAddresses();
  }, [token, locale]);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const response = await api.get('/addresses');
      setAddresses(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error('Failed to fetch addresses:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (data: any) => {
    setFormLoading(true);
    try {
      if (editingAddress) {
        await api.put(`/addresses/${editingAddress.id}`, data);
        toast.success('Address updated successfully!');
      } else {
        await api.post('/addresses', data);
        toast.success('Address saved successfully!');
      }
      setShowForm(false);
      setEditingAddress(null);
      fetchAddresses();
    } catch (error) {
      console.error('Failed to save address:', error);
      toast.error('Failed to save address details. Please try again.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this address?')) return;
    try {
      await api.delete(`/addresses/${id}`);
      toast.success('Address deleted successfully!');
      fetchAddresses();
    } catch (error) {
      console.error('Failed to delete address:', error);
      toast.error('Failed to delete address');
    }
  };

  if (loading) {
    return (
      <>
        <Header />
        <main className="min-h-screen py-12 bg-secondary/10">
          <div className="container mx-auto px-4 max-w-2xl space-y-4">
            {[...Array(2)].map((_, i) => (
              <div key={i} className="animate-pulse bg-card rounded-3xl h-36 border border-border/50" />
            ))}
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

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-playfair font-bold text-foreground">Saved Addresses</h1>
              <p className="text-sm text-muted-foreground mt-1">Manage your delivery locations</p>
            </div>
            {!showForm && (
              <button
                onClick={() => {
                  setEditingAddress(null);
                  setShowForm(true);
                }}
                className="flex items-center gap-2 px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/95 transition-all shadow-sm shadow-primary/25 cursor-pointer font-bold text-xs md:text-sm select-none"
              >
                <Plus size={16} />
                Add Address
              </button>
            )}
          </div>

          {showForm ? (
            <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm space-y-6">
              <h2 className="text-xl font-semibold text-foreground">
                {editingAddress ? 'Edit Address' : 'Add New Address'}
              </h2>
              <AddressForm
                address={editingAddress}
                onSubmit={handleSubmit}
                onCancel={() => {
                  setShowForm(false);
                  setEditingAddress(null);
                }}
                loading={formLoading}
              />
            </div>
          ) : (
            <div className="bg-card rounded-3xl p-6 md:p-8 border border-border/50 shadow-sm">
              <AddressList
                addresses={addresses}
                onEdit={(address) => {
                  setEditingAddress(address);
                  setShowForm(true);
                }}
                onDelete={handleDelete}
                onRefresh={fetchAddresses}
              />
            </div>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
