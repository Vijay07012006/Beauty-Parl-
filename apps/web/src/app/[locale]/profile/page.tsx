'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { User, Mail, Phone, Shield, Edit2, Save, Calendar, Copy, Lock, Key } from 'lucide-react';
import { toast } from 'sonner';
import Link from 'next/link';

export default function ProfilePage() {
  const router = useRouter();
  const params = useParams();
  const locale = (params?.locale as string) || 'en';

  const { user, updateProfile, hydrated, enable2fa, verify2fa, disable2fa } = useAuthStore();
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    birthday: '',
  });

  // 2FA state variables
  const [showSetupModal, setShowSetupModal] = useState(false);
  const [showDisableModal, setShowDisableModal] = useState(false);
  const [setupData, setSetupData] = useState<{ secret?: string; qrCode?: string; backupCodes?: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [disablePassword, setDisablePassword] = useState('');
  const [setupError, setSetupError] = useState('');
  const [disableError, setDisableError] = useState('');
  const [loading2fa, setLoading2fa] = useState(false);

  useEffect(() => {
    if (hydrated && !user) {
      router.push(`/${locale}/auth/login`);
    }
  }, [user, hydrated, router, locale]);

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

  if (!hydrated || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-primary"></div>
      </div>
    );
  }

  const handleSave = async () => {
    const result = await updateProfile(form.name, form.phone, form.birthday || undefined);
    if (result.success) {
      toast.success('Profile updated successfully!');
      setIsEditing(false);
    } else {
      toast.error(result.error || 'Failed to update profile');
    }
  };

  const handleStart2faSetup = async () => {
    setLoading2fa(true);
    setSetupError('');
    const result = await enable2fa();
    setLoading2fa(false);
    if (result.success && result.qrCode) {
      setSetupData({
        secret: result.secret,
        qrCode: result.qrCode,
        backupCodes: result.backupCodes,
      });
      setShowSetupModal(true);
    } else {
      toast.error(result.error || 'Failed to generate 2FA settings');
    }
  };

  const handleConfirm2faVerify = async () => {
    if (verificationCode.length < 6) {
      setSetupError('Please enter a 6-digit code');
      return;
    }
    setLoading2fa(true);
    setSetupError('');
    const result = await verify2fa(verificationCode);
    setLoading2fa(false);
    if (result.success) {
      toast.success('Two-factor authentication enabled successfully! 🎉');
      setShowSetupModal(false);
      setSetupData(null);
      setVerificationCode('');
    } else {
      setSetupError(result.error || 'Failed to verify code. Please try again.');
    }
  };

  const handleDisable2fa = async () => {
    if (!disablePassword) {
      setDisableError('Password is required');
      return;
    }
    setLoading2fa(true);
    setDisableError('');
    const result = await disable2fa(disablePassword);
    setLoading2fa(false);
    if (result.success) {
      toast.success('Two-factor authentication disabled.');
      setShowDisableModal(false);
      setDisablePassword('');
    } else {
      setDisableError(result.error || 'Failed to disable 2FA. Verify password.');
    }
  };

  const copyBackupCodes = () => {
    if (setupData?.backupCodes) {
      navigator.clipboard.writeText(setupData.backupCodes.join('\n'));
      toast.success('Backup codes copied to clipboard!');
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

          {/* Two-Factor Authentication (2FA) Section */}
          <div className="mt-6 bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary/10 text-primary rounded-xl">
                <Lock className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-playfair font-bold">Two-Factor Authentication (2FA)</h2>
            </div>
            
            {user.isTwoFactorEnabled ? (
              <div className="space-y-4">
                <div className="p-4 bg-green-500/10 border border-green-500/20 text-green-700 dark:text-green-400 rounded-xl text-sm flex items-center gap-2">
                  <span className="w-2 h-2 bg-green-500 rounded-full animate-ping" />
                  <strong>2FA is enabled.</strong> Your account has an extra layer of protection.
                </div>
                <button
                  onClick={() => setShowDisableModal(true)}
                  className="px-5 py-2.5 bg-red-500 text-white rounded-full hover:bg-red-600 transition text-xs font-bold cursor-pointer"
                >
                  Disable 2FA
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Two-factor authentication adds an extra layer of security to your account by requiring a verification code from an authenticator app (like Google Authenticator or Duo) when you sign in.
                </p>
                <button
                  onClick={handleStart2faSetup}
                  disabled={loading2fa}
                  className="px-5 py-2.5 bg-primary text-white rounded-full hover:bg-primary/95 transition text-xs font-bold disabled:opacity-55 cursor-pointer"
                >
                  {loading2fa ? 'Generating Setup...' : 'Set Up 2FA'}
                </button>
              </div>
            )}
          </div>

          {/* Orders Section */}
          <div className="mt-6 bg-card rounded-2xl shadow-lg p-8 border border-border/50">
            <h2 className="text-xl font-playfair font-bold mb-4">Recent Orders</h2>
            <p className="text-muted-foreground text-sm">No orders yet. Start shopping!</p>
          </div>
        </div>
      </main>

      {/* 2FA Setup Modal */}
      {showSetupModal && setupData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-card p-6 md:p-8 rounded-3xl max-w-lg w-full shadow-2xl border border-border/50 relative my-8">
            <button
              onClick={() => { setShowSetupModal(false); setSetupData(null); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl cursor-pointer"
            >
              ✕
            </button>
            
            <h3 className="text-2xl font-playfair font-bold text-center mb-6">Configure 2FA Authenticator</h3>
            
            <div className="space-y-6">
              <div className="text-center">
                <p className="text-sm text-muted-foreground mb-4">
                  Scan the QR code below using your mobile authenticator app.
                </p>
                <div className="bg-white p-4 w-fit mx-auto rounded-2xl shadow-sm border border-border/40">
                  <img src={setupData.qrCode} alt="Scan QR Code" className="w-48 h-48" />
                </div>
                <div className="mt-4 p-3 bg-secondary/20 rounded-xl text-left">
                  <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider block">Or enter key manually</span>
                  <code className="font-mono text-xs font-semibold text-primary select-all break-all">{setupData.secret}</code>
                </div>
              </div>

              {setupData.backupCodes && setupData.backupCodes.length > 0 && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 text-amber-800 dark:text-amber-300 rounded-2xl space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold flex items-center gap-1">
                      <Key className="w-3.5 h-3.5" /> Emergency Backup Codes
                    </span>
                    <button
                      onClick={copyBackupCodes}
                      className="text-[10px] font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                    >
                      <Copy className="w-3 h-3" /> Copy All
                    </button>
                  </div>
                  <p className="text-[10px] opacity-90 leading-normal">
                    Store these backup codes somewhere safe. You can use them to sign in if you lose access to your authenticator device.
                  </p>
                  <div className="grid grid-cols-2 gap-2 text-xs font-mono bg-card/65 p-3 rounded-xl border border-amber-500/10 text-foreground">
                    {setupData.backupCodes.map((code) => (
                      <div key={code}>{code}</div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-3 pt-2">
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block">
                  Verify 6-Digit Code
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  value={verificationCode}
                  onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, ''))}
                  className="w-full p-3.5 text-center text-xl font-bold tracking-widest rounded-2xl border border-input bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  placeholder="000000"
                />
                
                {setupError && (
                  <p className="text-red-500 text-xs text-center font-semibold">{setupError}</p>
                )}

                <button
                  onClick={handleConfirm2faVerify}
                  disabled={loading2fa || verificationCode.length < 6}
                  className="w-full py-3.5 bg-primary text-white rounded-full hover:bg-primary/95 transition font-bold text-xs shadow-md shadow-primary/25 disabled:opacity-55 cursor-pointer"
                >
                  {loading2fa ? 'Enabling...' : 'Verify & Enable 2FA'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 2FA Disable Modal */}
      {showDisableModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card p-6 md:p-8 rounded-3xl max-w-md w-full shadow-2xl border border-border/50 relative">
            <button
              onClick={() => { setShowDisableModal(false); setDisablePassword(''); setDisableError(''); }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground text-xl cursor-pointer"
            >
              ✕
            </button>

            <h3 className="text-xl font-playfair font-bold mb-3">Disable Two-Factor Authentication</h3>
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              To turn off 2FA, please verify your account password. This will delete your 2FA configurations.
            </p>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground block mb-1">
                  Password
                </label>
                <input
                  type="password"
                  value={disablePassword}
                  onChange={(e) => setDisablePassword(e.target.value)}
                  className="w-full p-3 rounded-2xl border border-input bg-background focus:outline-none focus:border-primary text-sm"
                  placeholder="••••••••"
                />
              </div>

              {disableError && (
                <p className="text-red-500 text-xs font-semibold">{disableError}</p>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => { setShowDisableModal(false); setDisablePassword(''); setDisableError(''); }}
                  className="flex-1 py-3 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-bold rounded-full transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDisable2fa}
                  disabled={loading2fa || !disablePassword}
                  className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white text-xs font-bold rounded-full transition disabled:opacity-55 cursor-pointer"
                >
                  {loading2fa ? 'Disabling...' : 'Confirm Disable'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </>
  );
}
