'use client';

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Download, Printer, User, FileText, Calendar, DollarSign, Award, Shield } from 'lucide-react';
import { api } from '@/lib/api';
import { toast } from 'sonner';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';

interface UserExportData {
  id: number;
  name: string;
  email: string;
  role: string;
  phone?: string;
  isActive: boolean;
  loyaltyPoints: number;
  loyaltyTier: string;
  totalSpent: number;
  createdAt: string;
}

export default function UserExportPage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';
  const userId = params?.id;

  const [userData, setUserData] = useState<UserExportData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchUserData() {
      try {
        const { data } = await api.get(`/admin/users`);
        // Find user by id
        const user = data.users?.find((u: any) => String(u.id) === String(userId));
        if (user) {
          setUserData(user);
        } else {
          toast.error('User profile details not found');
        }
      } catch (err) {
        console.error('Failed to fetch user export details:', err);
        toast.error('Could not load user profile metadata');
      } finally {
        setLoading(false);
      }
    }
    if (userId) {
      fetchUserData();
    }
  }, [userId]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    const el = document.getElementById('user-profile-report-card');
    if (!el) return;

    toast.loading('Generating PDF report...');
    try {
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const imgW = 210;
      const imgH = (canvas.height * imgW) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, imgW, imgH);
      pdf.save(`user_report_${userData?.name.toLowerCase().replace(/\s+/g, '_') || userId}.pdf`);
      toast.dismiss();
      toast.success('PDF report downloaded successfully!');
    } catch (err) {
      toast.dismiss();
      toast.error('Failed to generate PDF report');
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        <p className="text-sm text-muted-foreground font-medium">Loading user account record...</p>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <p className="text-sm font-semibold text-foreground">User account record not found</p>
        <button
          onClick={() => router.push(`/${locale}/admin/dashboard`)}
          className="flex items-center gap-2 px-4 py-2 bg-secondary rounded-xl text-xs font-bold transition hover:bg-secondary/80"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-6 md:p-12 flex flex-col items-center">
      {/* ── Action buttons bar (hidden on print) ── */}
      <div className="w-full max-w-2xl flex items-center justify-between gap-4 mb-8 print:hidden">
        <button
          onClick={() => router.push(`/${locale}/admin/dashboard`)}
          className="flex items-center gap-2 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-muted-foreground hover:text-foreground rounded-2xl text-xs font-bold transition cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handlePrint}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-secondary hover:bg-secondary/80 text-foreground rounded-2xl text-xs font-bold transition cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Report</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-primary text-white rounded-2xl text-xs font-bold hover:bg-primary/95 transition shadow-md shadow-primary/20 cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Download PDF</span>
          </button>
        </div>
      </div>

      {/* ── Report Card (Optimized for PDF download and printing) ── */}
      <div
        id="user-profile-report-card"
        className="w-full max-w-2xl bg-card border border-border/60 rounded-3xl p-8 shadow-xl print:shadow-none print:border-none relative overflow-hidden"
      >
        {/* Glow tint decorator */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full filter blur-3xl -mr-8 -mt-8 pointer-events-none print:hidden" />

        <div className="space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-border/40 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2">
                Beauty Parlé <span className="text-primary font-light text-base">Profile Registry</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-1">Official Member Governance Audit Card</p>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">ID Record</span>
              <p className="font-mono text-sm font-bold text-primary">#{userData.id}</p>
            </div>
          </div>

          {/* User Core Bio Grid */}
          <div className="grid grid-cols-2 gap-6 bg-secondary/20 p-5 rounded-2xl border border-border/30">
            <div className="space-y-4">
              <div className="flex gap-3">
                <User className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Full Name</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{userData.name}</p>
                </div>
              </div>

              <div className="flex gap-3">
                <FileText className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Email Address</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">{userData.email}</p>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex gap-3">
                <Shield className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">System Role</p>
                  <span className="inline-block text-[10px] font-bold uppercase tracking-wider bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1.5 border border-primary/10">
                    {userData.role}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <Calendar className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Registered Since</p>
                  <p className="text-sm font-semibold text-foreground mt-0.5">
                    {new Date(userData.createdAt).toLocaleDateString([], { day: '2-digit', month: 'long', year: 'numeric' })}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Metrics section */}
          <div>
            <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">Loyalty & Transaction History</h3>
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 bg-card border border-border/50 rounded-2xl text-center">
                <DollarSign className="w-5 h-5 text-emerald-500 mx-auto mb-1.5" />
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Total Revenue</p>
                <p className="text-lg font-bold text-foreground mt-1">₹{Number(userData.totalSpent || 0).toFixed(2)}</p>
              </div>

              <div className="p-4 bg-card border border-border/50 rounded-2xl text-center">
                <Award className="w-5 h-5 text-amber-500 mx-auto mb-1.5" />
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Loyalty Points</p>
                <p className="text-lg font-bold text-foreground mt-1">{userData.loyaltyPoints || 0}</p>
              </div>

              <div className="p-4 bg-card border border-border/50 rounded-2xl text-center">
                <Shield className="w-5 h-5 text-purple-500 mx-auto mb-1.5" />
                <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-wider">Tier Status</p>
                <p className="text-lg font-bold text-foreground mt-1 capitalize">{userData.loyaltyTier || 'Silver'}</p>
              </div>
            </div>
          </div>

          {/* Verification seal and signature placeholder */}
          <div className="flex items-center justify-between border-t border-border/40 pt-6 mt-8">
            <div className="space-y-1">
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Status verification</p>
              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
                userData.isActive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-500'
              }`}>
                <span className={`w-1.5 h-1.5 rounded-full ${userData.isActive ? 'bg-emerald-500' : 'bg-red-500'}`} />
                <span>{userData.isActive ? 'Active Member' : 'Suspended Member'}</span>
              </span>
            </div>
            <div className="text-right space-y-1.5">
              <div className="w-32 h-0.5 bg-border/80 ml-auto" />
              <p className="text-[9px] text-muted-foreground uppercase tracking-wider">Authorized Auditor Signature</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
