'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import {
  LayoutDashboard,
  Package,
  ShoppingBag,
  Users,
  Ticket,
  Star,
  Image as ImageIcon,
  Video,
  Settings,
  LogOut,
  Menu,
  X,
  Shield,
  FileText,
  UserCog,
  ChevronRight,
  HelpCircle,
  TrendingUp,
  Activity,
  AlertTriangle,
  Upload,
} from 'lucide-react';
import { NotificationCenter } from './NotificationCenter';
import { io } from 'socket.io-client';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: Upload, label: 'Bulk CSV Manager', href: '/admin/products/bulk' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Ticket, label: 'Coupons', href: '/admin/coupons' },
  { icon: Star, label: 'Reviews', href: '/admin/reviews' },
  { icon: TrendingUp, label: 'Analytics', href: '/admin/analytics' },
  { icon: Activity, label: 'Live View', href: '/admin/live' },
  { icon: AlertTriangle, label: 'Inventory Alerts', href: '/admin/inventory' },
  { icon: ImageIcon, label: 'UGC Photos', href: '/admin/ugc' },
  { icon: Video, label: 'Live Shopping', href: '/admin/live-shopping' },
  { icon: HelpCircle, label: 'Support Tickets', href: '/admin/tickets' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

const superAdminItems = [
  { icon: Shield, label: 'Roles', href: '/admin/roles' },
  { icon: FileText, label: 'Audit Logs', href: '/admin/audit-logs' },
  { icon: UserCog, label: 'User Management', href: '/admin/user-management' },
  { icon: Users, label: 'Active Sessions', href: '/admin/active-sessions' },
  { icon: LayoutDashboard, label: 'Audit Dashboard', href: '/admin/audit-dashboard' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split('/')[1] || 'en';
  const { user, logout, hydrate } = useAuthStore();
  const isSuperAdmin = user?.role === 'super_admin';

  useEffect(() => { hydrate(); }, []);

  useEffect(() => {
    const socketUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const socket = io(socketUrl, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    socket.on('new_ticket', (data) => {
      console.log('🔔 New ticket notification:', data);
    });

    return () => {
      socket.disconnect();
    };
  }, []);

  useEffect(() => {
    if (user && user.role !== 'admin' && user.role !== 'super_admin') {
      router.push(`/${locale}`);
    }
  }, [user, router, locale]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <p className="text-red-500 font-medium">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  const renderNavItem = (item: typeof navItems[0], superAdmin = false) => {
    const hrefWithLocale = `/${locale}${item.href}`;
    const isActive = pathname === hrefWithLocale || pathname?.startsWith(hrefWithLocale + '/');
    return (
      <Link
        key={item.href}
        href={hrefWithLocale}
        onClick={() => setIsSidebarOpen(false)}
        className={`
          flex items-center gap-3 px-4 py-2.5 rounded-xl transition-all duration-200 group
          ${isActive
            ? 'bg-primary text-white shadow-lg shadow-primary/20 font-medium'
            : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground'}
        `}
      >
        <item.icon size={18} className={isActive ? 'text-white' : 'group-hover:text-foreground'} />
        <span className="text-sm flex-1">{item.label}</span>
        {superAdmin && (
          <span className="text-[9px] font-bold uppercase tracking-wider bg-primary/15 text-primary px-1.5 py-0.5 rounded-full">
            Super
          </span>
        )}
        {isActive && <ChevronRight size={14} className="text-white/70" />}
      </Link>
    );
  };

  return (
    <div className="flex h-screen overflow-hidden bg-secondary/10">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/50 backdrop-blur-sm cursor-pointer"
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:relative top-0 left-0 z-40 h-screen w-64 flex-shrink-0
        bg-card border-r border-border/40 flex flex-col
        transition-transform duration-300 ease-in-out shadow-xl lg:shadow-none
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Brand */}
        <div className="p-5 border-b border-border/40 shrink-0">
          <h2 className="text-xl font-bold text-primary tracking-tight">Beauty Parlé</h2>
          <div className="flex items-center gap-1.5 mt-1">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Admin Panel</span>
            {isSuperAdmin && (
              <span className="text-[9px] font-bold bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">Super Admin</span>
            )}
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
          {navItems.map(item => renderNavItem(item))}

          {isSuperAdmin && (
            <>
              <div className="pt-4 pb-1 px-4">
                <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/60">Super Admin</p>
              </div>
              {superAdminItems.map(item => renderNavItem(item, true))}
            </>
          )}
        </nav>

        {/* User profile section */}
        <div className="p-3 border-t border-border/40 shrink-0">
          <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-secondary/30 mb-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary/60 to-primary flex items-center justify-center text-sm font-bold text-white shrink-0">
              {user.name?.charAt(0)?.toUpperCase() || 'A'}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{user.name}</p>
              <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
            </div>
          </div>
          <button
            onClick={() => { logout(); router.push(`/${locale}/auth/login`); }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors text-sm cursor-pointer"
          >
            <LogOut size={16} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Header for Desktop & Mobile */}
        <header className="flex items-center justify-between lg:justify-end px-4 md:px-8 py-3 bg-card/65 backdrop-blur-md border-b border-border/40 shrink-0 gap-4">
          <div className="flex items-center gap-2 lg:hidden">
            <h1 className="text-lg font-bold text-primary">Beauty Parlé</h1>
          </div>
          
          <div className="flex items-center gap-3 ml-auto">
            <NotificationCenter />
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="lg:hidden p-2 rounded-xl hover:bg-secondary transition-colors"
              aria-label="Toggle sidebar"
            >
              {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
