'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { User, Mail, Phone, Shield, Edit2, Save, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user, token, updateProfile } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
  });

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/auth/login`);
    }
  }, [token, router, locale]);

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || '',
        email: user.email || '',
        phone: user.phone || '',
        birthday: user.birthday ? new Date(user.birthday).toISOString().split('T')[0] : '',
      });
    }
  }, [user]);

  if (!user) return null;

  const handleSave = async () => {
    const result = await updateProfile(form.name, form.phone, form.birthday || undefined);
    if (result.success) {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  return (
    <>
      <Header />
      <main className="min-h-screen py-12 bg-secondary/30">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center text-2xl font-bold text-primary">
                  {user.name?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h1 className="text-2xl font-playfair font-bold">{user.name}</h1>
                  <p className="text-sm text-muted-foreground">{user.role === 'super_admin' ? 'Admin' : 'Member'}</p>
                </div>
              </div>
              <button
                onClick={isEditing ? handleSave : () => setIsEditing(true)}
                className="px-4 py-2 bg-primary/10 text-primary rounded-full hover:bg-primary/20 transition text-sm font-medium flex items-center gap-2 cursor-pointer"
              >
                {isEditing ? <Save size={16} /> : <Edit2 size={16} />}
                {isEditing ? 'Save' : 'Edit Profile'}
              </button>
            </div>

            {/* Profile Info */}
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                <User size={20} className="text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Full Name</p>
                  {isEditing ? (
                    <input
                      value={form.name}
                      onChange={(e) => setForm({...form, name: e.target.value})}
                      className="bg-transparent border-b border-primary/30 focus:outline-none px-1 w-full text-foreground"
                    />
                  ) : (
                    <p className="font-medium">{user.name}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl opacity-80">
                <Mail size={20} className="text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Email (Not editable)</p>
                  <p className="font-medium">{user.email}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                <Phone size={20} className="text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Phone</p>
                  {isEditing ? (
                    <input
                      value={form.phone}
                      onChange={(e) => setForm({...form, phone: e.target.value})}
                      className="bg-transparent border-b border-primary/30 focus:outline-none px-1 w-full text-foreground"
                    />
                  ) : (
                    <p className="font-medium">{user.phone || 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                <Calendar size={20} className="text-primary" />
                <div className="flex-1">
                  <p className="text-xs text-muted-foreground">Birthday</p>
                  {isEditing ? (
                    <input
                      type="date"
                      value={form.birthday}
                      onChange={(e) => setForm({...form, birthday: e.target.value})}
                      className="bg-transparent border-b border-primary/30 focus:outline-none px-1 w-full text-foreground"
                    />
                  ) : (
                    <p className="font-medium">{user.birthday ? new Date(user.birthday).toLocaleDateString() : 'Not provided'}</p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-secondary/20 rounded-xl">
                <Shield size={20} className="text-primary" />
                <div>
                  <p className="text-xs text-muted-foreground">Account Status</p>
                  <p className="font-medium text-green-600">✓ Verified</p>
                </div>
              </div>
            </div>

            {/* Change Password & Saved Addresses Links */}
            <div className="mt-6 pt-6 border-t border-border/50 flex justify-between items-center text-sm font-medium">
              <Link href={`/${locale}/addresses`} className="text-primary hover:underline">
                Saved Addresses →
              </Link>
              <Link href={`/${locale}/auth/forgot-password`} className="text-primary hover:underline">
                Change Password →
              </Link>
            </div>
          </div>

          {/* Orders Section */}
          <div className="mt-6 bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h2 className="text-xl font-playfair font-bold mb-4">Recent Orders</h2>
            <p className="text-muted-foreground text-sm">No orders yet. Start shopping!</p>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
