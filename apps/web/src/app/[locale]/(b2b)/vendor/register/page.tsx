'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Building, Clipboard, Send, BadgeCheck, ShieldAlert } from 'lucide-react';

export default function VendorRegisterPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user } = useAuthStore();
  const [storeName, setStoreName] = useState('');
  const [businessRegNumber, setBusinessRegNumber] = useState('');
  const [vendorRecord, setVendorRecord] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const fetchVendorStatus = async () => {
    try {
      const res = await api.get('/admin/vendors'); // Just load to check if current user is registered
      const list = Array.isArray(res.data) ? res.data : [];
      const match = list.find((v: any) => v.userId === user?.id);
      if (match) {
        setVendorRecord(match);
      }
    } catch {
      // Ignored if user role cannot read administrative vendor logs yet
    }
  };

  useEffect(() => {
    if (!user) {
      toast.error('Please sign in to register as a partner vendor');
      router.push(`/${locale}/auth/login`);
      return;
    }

    async function checkStatus() {
      await fetchVendorStatus();
      setLoading(false);
    }
    checkStatus();
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !businessRegNumber.trim()) {
      toast.error('Please fill in all registration fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await api.post('/vendor/register', { storeName, businessRegNumber });
      toast.success('Vendor registration application submitted successfully!');
      setVendorRecord(res.data);
    } catch {
      toast.error('Failed to submit vendor application');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
        <Header />
        <div className="flex-grow flex items-center justify-center text-xs text-zinc-400 py-20">
          Checking partner application status...
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-zinc-950 text-zinc-100 transition-colors duration-300">
      <Header />

      <main className="flex-grow flex items-center justify-center py-20 px-4">
        <div className="w-full max-w-lg bg-zinc-900/60 border border-zinc-800/80 p-8 rounded-3xl shadow-2xl space-y-8 backdrop-blur">
          <div className="text-center space-y-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 rounded-full text-xs font-bold text-primary tracking-wider uppercase border border-primary/20">
              🤝 Merchant Partner
            </span>
            <h1 className="text-3xl font-bold font-playfair tracking-tight">Vendor Registration</h1>
            <p className="text-xs text-zinc-400">
              Partner with Beauty Parlé. List your products and access bulk logistics.
            </p>
          </div>

          {vendorRecord ? (
            <div className="p-6 bg-zinc-950 rounded-2xl border border-zinc-850 space-y-4 text-center">
              {vendorRecord.status === 'approved' ? (
                <>
                  <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 text-2xl font-bold">
                    <BadgeCheck size={24} />
                  </div>
                  <h3 className="font-bold text-zinc-200">Merchant Approved!</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Your merchant store <strong>{vendorRecord.storeName}</strong> is verified. You can now log in to the wholesale panel or list items under your brand!
                  </p>
                  <button
                    onClick={() => router.push(`/${locale}/vendor/dashboard`)}
                    className="mt-4 px-6 py-2.5 bg-primary hover:bg-primary/95 text-white rounded-full text-xs font-bold transition shadow-lg cursor-pointer"
                  >
                    Go to Vendor Dashboard
                  </button>
                </>
              ) : vendorRecord.status === 'rejected' ? (
                <>
                  <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-red-500/10 text-red-500 border border-red-500/20 text-2xl font-bold">
                    ⚠️
                  </div>
                  <h3 className="font-bold text-zinc-200">Application Rejected</h3>
                  <p className="text-xs text-red-400 max-w-sm mx-auto leading-relaxed">
                    Unfortunately, your business registry request could not be validated. Contact B2B support if you believe this is an error.
                  </p>
                </>
              ) : (
                <>
                  <div className="w-12 h-12 mx-auto flex items-center justify-center rounded-full bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 text-2xl font-bold animate-pulse">
                    ⏳
                  </div>
                  <h3 className="font-bold text-zinc-200">Application Pending</h3>
                  <p className="text-xs text-zinc-400 max-w-sm mx-auto leading-relaxed">
                    Your registry request for <strong>{vendorRecord.storeName}</strong> is under review by Beauty Parlé administrators. Verification takes up to 24 hours.
                  </p>
                </>
              )}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
                  Store / Brand Name
                </label>
                <div className="relative">
                  <Building size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="e.g. Lavender Organic Care"
                    className="w-full text-xs pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-zinc-400 block uppercase tracking-wider">
                  Business Registration ID / VAT
                </label>
                <div className="relative">
                  <Clipboard size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={businessRegNumber}
                    onChange={(e) => setBusinessRegNumber(e.target.value)}
                    placeholder="e.g. BR-9821731"
                    className="w-full text-xs pl-10 pr-4 py-3.5 bg-zinc-950 border border-zinc-800/80 rounded-2xl focus:outline-none focus:border-primary/50 text-zinc-100"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full py-4 bg-primary hover:bg-primary/95 text-white font-semibold rounded-full flex items-center justify-center gap-1.5 shadow-lg transition hover:scale-[1.01] text-xs cursor-pointer disabled:opacity-50"
              >
                <Send size={14} /> Submit Application
              </button>
            </form>
          )}

          <div className="p-4 bg-zinc-500/5 rounded-2xl border border-zinc-500/10 text-[10px] leading-relaxed text-zinc-400 flex gap-2">
            <ShieldAlert size={14} className="shrink-0 text-yellow-500 mt-0.5" />
            <span>
              <strong>Partnership Note:</strong> Approved merchant listings must respect Beauty Parlé organic quality standards. Platform transaction fees are currently locked at a dynamic 15% rate.
            </span>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
