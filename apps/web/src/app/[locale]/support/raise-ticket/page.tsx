'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { toast } from 'sonner';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { 
  FileText, 
  ArrowLeft, 
  Send,
  LifeBuoy
} from 'lucide-react';

export default function RaiseTicketPage() {
  const { user, token } = useAuthStore();
  const params = useParams();
  const router = useRouter();
  const locale = (params?.locale as string) || 'en';

  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [orderId, setOrderId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!token) {
      toast.error('You must be signed in to raise a support ticket');
      router.push(`/${locale}/auth/login`);
      return;
    }

    // Client-side validation
    if (!subject.trim()) {
      toast.error('Subject is required');
      return;
    }
    if (subject.length < 5) {
      toast.error('Subject must be at least 5 characters');
      return;
    }
    if (!message.trim()) {
      toast.error('Message details are required');
      return;
    }
    if (message.length < 15) {
      toast.error('Please describe your issue in more detail (min 15 characters)');
      return;
    }

    try {
      setSubmitting(true);
      const res = await api.post('/support/tickets', {
        subject: subject.trim(),
        message: message.trim(),
        orderId: orderId ? parseInt(orderId, 10) : undefined
      }, { withCredentials: true });

      toast.success(`🎉 Ticket #${res.data.id} raised successfully!`);
      setSubject('');
      setMessage('');
      setOrderId('');
      
      // Redirect to support dashboard or tickets list
      router.push(`/${locale}/support`);
    } catch (error: any) {
      console.error('❌ Failed to raise ticket:', error);
      const errorMsg = error?.response?.data?.message || 'Failed to submit support ticket. Please try again.';
      toast.error(errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-secondary/5 to-background py-12">
      <div className="container mx-auto px-4 max-w-2xl">
        
        {/* Navigation Breadcrumb */}
        <div className="mb-6">
          <Link 
            href={`/${locale}/support`}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft size={14} /> Back to Support Section
          </Link>
        </div>

        {/* Shell panel */}
        <div className="p-6 md:p-8 rounded-[32px] border border-border/40 bg-card/65 backdrop-blur-md shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-border/40 pb-5">
            <div className="p-2.5 bg-primary/10 border border-primary/20 text-primary rounded-2xl">
              <LifeBuoy className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-foreground">Raise Support Ticket</h1>
              <p className="text-xs text-muted-foreground mt-0.5">Submit a claim or query to our helpdesk agents.</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                Subject or Issue Summary *
              </label>
              <input
                type="text"
                required
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="e.g., Damaged item in my shipment"
                className="w-full text-xs p-3.5 bg-secondary/15 rounded-xl border border-border/50 focus:border-primary outline-none transition"
              />
              <span className="text-[9px] text-muted-foreground block">Minimum 5 characters. Keep it brief.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                Associated Order ID (Optional)
              </label>
              <input
                type="number"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                placeholder="e.g., 108"
                className="w-full text-xs p-3.5 bg-secondary/15 rounded-xl border border-border/50 focus:border-primary outline-none transition"
              />
              <span className="text-[9px] text-muted-foreground block">Add the number ID of the order if applicable.</span>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground block">
                Message & Request Details *
              </label>
              <textarea
                required
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Please describe what went wrong, including any relevant product names or details. Our helpdesk team will investigate and get back to you shortly."
                className="w-full text-xs p-3.5 bg-secondary/15 rounded-xl border border-border/50 focus:border-primary outline-none transition resize-none leading-relaxed"
              />
              <span className="text-[9px] text-muted-foreground block">Minimum 15 characters. Be detailed.</span>
            </div>

            <div className="pt-2 flex items-center justify-between gap-4">
              <span className="text-[10px] text-muted-foreground font-semibold">
                * Indicates required field
              </span>
              <button
                type="submit"
                disabled={submitting}
                className="px-6 py-3 bg-primary hover:bg-primary/95 text-white font-bold rounded-xl text-xs flex items-center gap-2 transition cursor-pointer select-none shadow-md disabled:opacity-50"
              >
                <Send size={13} /> {submitting ? 'Submitting request...' : 'Raise Ticket'}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
}
