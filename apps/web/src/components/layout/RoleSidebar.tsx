'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { NAVIGATION_ITEMS } from '@/config/navigation';
import { 
  ChevronLeft, 
  ChevronRight, 
  Sparkles, 
  LogOut,
  Building,
  ShieldCheck,
  LayoutDashboard
} from 'lucide-react';

export function RoleSidebar() {
  const { user, logout } = useAuthStore();
  const pathname = usePathname();
  const router = useRouter();
  const locale = pathname?.split('/')[1] || 'en';
  
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (!user) return null;
  const role = user.role;
  if (role !== 'admin' && role !== 'super_admin' && role !== 'vendor') {
    return null;
  }

  const sections = NAVIGATION_ITEMS[role] || [];

  const handleLogout = () => {
    logout();
    router.push(`/${locale}`);
  };

  return (
    <aside 
      className={`shrink-0 min-h-screen bg-zinc-950 border-r border-zinc-800/80 transition-all duration-300 flex flex-col z-35 sticky top-0 ${
        isCollapsed ? 'w-16' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className="h-16 border-b border-zinc-800/80 flex items-center justify-between px-4">
        {!isCollapsed && (
          <Link href={`/${locale}`} className="flex items-center gap-1.5 group select-none">
            <span className="font-playfair font-bold text-sm tracking-wide text-primary">
              Beauty Parlé
            </span>
            <Sparkles size={12} className="text-accent animate-pulse" />
          </Link>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto text-primary text-[10px] font-bold">
            BP
          </div>
        )}

        {!isCollapsed && (
          <button 
            onClick={() => setIsCollapsed(true)}
            className="p-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center py-2.5">
          <button 
            onClick={() => setIsCollapsed(false)}
            className="p-1 bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 rounded-lg transition cursor-pointer"
          >
            <ChevronRight size={14} />
          </button>
        </div>
      )}

      {/* User Info Badge */}
      <div className={`p-4 border-b border-zinc-800/50 flex items-center gap-3 ${isCollapsed ? 'justify-center' : ''}`}>
        <div className="w-9 h-9 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-200 font-bold shrink-0 uppercase select-none">
          {(user?.name || user?.email || 'User').slice(0, 2)}
        </div>
        {!isCollapsed && (
          <div className="overflow-hidden">
            <h4 className="text-xs font-semibold text-zinc-200 truncate">{user?.name || user?.email || 'User'}</h4>
            <span className="inline-flex items-center gap-1 mt-0.5 px-2 py-0.5 bg-primary/10 rounded-full text-[9px] font-bold text-primary tracking-wider uppercase border border-primary/20">
              {role === 'super_admin' ? <ShieldCheck size={8} /> : null}
              {role === 'vendor' ? <Building size={8} /> : null}
              {role.replace('_', ' ')}
            </span>
          </div>
        )}
      </div>

      {/* Navigation list */}
      <div className="flex-grow overflow-y-auto py-6 px-3 space-y-6">
        {sections.map((section: any, sIdx: number) => (
          <div key={sIdx} className="space-y-2">
            {!isCollapsed && (
              <p className="text-[9px] font-bold text-zinc-500 uppercase tracking-widest px-3">
                {section.section}
              </p>
            )}
            <div className="space-y-1">
              {section.items.map((item: any, iIdx: number) => {
                const prefixedHref = `/${locale}${item.href}`;
                const isActive = pathname === prefixedHref || pathname?.startsWith(prefixedHref + '/');
                
                return (
                  <Link
                    key={iIdx}
                    href={prefixedHref}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium transition duration-200 select-none ${
                      isActive 
                        ? 'bg-primary/15 text-primary border-l-2 border-primary' 
                        : 'text-zinc-400 hover:bg-zinc-900/60 hover:text-zinc-200'
                    } ${isCollapsed ? 'justify-center' : ''}`}
                    title={isCollapsed ? item.label : undefined}
                  >
                    <LayoutDashboard size={14} className="shrink-0" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Sidebar Footer / Logout */}
      <div className="p-3 border-t border-zinc-800/80">
        <button
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-medium text-rose-500 hover:bg-rose-500/10 transition cursor-pointer select-none ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Logout' : undefined}
        >
          <LogOut size={14} className="shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
