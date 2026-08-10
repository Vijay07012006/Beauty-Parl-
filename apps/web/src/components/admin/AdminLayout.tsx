'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingBag, 
  Users, 
  Settings, 
  LogOut,
  Menu,
  X,
  Ticket,
  MessageSquare,
  Image as ImageIcon
} from 'lucide-react';
import { useState } from 'react';

const navItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin/dashboard' },
  { icon: Package, label: 'Products', href: '/admin/products' },
  { icon: ShoppingBag, label: 'Orders', href: '/admin/orders' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Ticket, label: 'Coupons', href: '/admin/coupons' },
  { icon: MessageSquare, label: 'Reviews', href: '/admin/reviews' },
  { icon: ImageIcon, label: 'UGC Photos', href: '/admin/ugc' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const locale = pathname?.split('/')[1] || 'en';
  const { user, logout, hydrate } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    hydrate();
  }, []);

  useEffect(() => {
    if (user && (user.role !== 'admin' && user.role !== 'super_admin')) {
      router.push(`/${locale}`);
    }
  }, [user, router, locale]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user.role !== 'admin' && user.role !== 'super_admin') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">Access denied. Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-secondary/30">
      {/* Mobile backdrop */}
      {isSidebarOpen && (
        <button
          type="button"
          aria-label="Close sidebar"
          onClick={() => setIsSidebarOpen(false)}
          className="lg:hidden fixed inset-0 z-30 bg-black/40 backdrop-blur-sm cursor-pointer"
        />
      )}

      {/* Mobile Sidebar Toggle */}
      <button
        onClick={() => setIsSidebarOpen(!isSidebarOpen)}
        aria-label={isSidebarOpen ? 'Close menu' : 'Open menu'}
        className="lg:hidden fixed top-4 left-4 z-50 p-2 bg-card rounded-lg shadow-md cursor-pointer"
      >
        {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      <div className="flex">
        {/* Sidebar */}
        <aside className={`
          fixed lg:sticky top-0 z-40 w-64 max-w-[85vw] h-screen bg-card border-r border-border/50 transition-transform duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        `}>
          <div className="p-6">
            <h2 className="text-2xl font-playfair font-bold text-primary">Beauty Parlé</h2>
            <p className="text-xs text-muted-foreground">Admin Panel</p>
          </div>

          <nav className="px-3 space-y-1">
            {navItems.map((item) => {
              const hrefWithLocale = `/${locale}${item.href}`;
              const isActive = pathname === hrefWithLocale || pathname?.startsWith(hrefWithLocale + '/');
              return (
                <Link
                  key={item.href}
                  href={hrefWithLocale}
                  onClick={() => setIsSidebarOpen(false)}
                  className={`
                    flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                    ${isActive 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-secondary/50 text-muted-foreground hover:text-foreground'}
                  `}
                >
                  <item.icon size={20} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          <div className="absolute bottom-6 left-3 right-3">
            <button
              onClick={() => {
                logout();
                router.push(`/${locale}/auth/login`);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-red-500 hover:bg-red-50 transition-colors cursor-pointer"
            >
              <LogOut size={20} />
              <span>Logout</span>
            </button>
            <p className="text-xs text-muted-foreground mt-4 text-center truncate">
              {user.name} ({user.email})
            </p>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 pt-16 sm:p-6 sm:pt-16 lg:p-8 lg:pt-8">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
