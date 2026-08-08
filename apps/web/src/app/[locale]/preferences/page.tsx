'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { api } from '@/lib/api';
import { Mail, Bell, Megaphone, Send, ArrowLeft } from 'lucide-react';
import { toast } from 'sonner';
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

  const { token } = useAuthStore();
  const [preferences, setPreferences] = useState<Preferences>({
    marketing: true,
    order_updates: true,
    newsletter: false,
    promotional: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!token) {
      router.push(`/${locale}/auth/login`);
      return;
    }
    fetchPreferences();
  }, [token, locale]);

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
        </div>
      </main>
      <Footer />
    </>
  );
}
