'use client';

import React, { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { RoleSidebar } from './RoleSidebar';

export function RoleLayoutWrapper({ children }: { children: React.ReactNode }) {
  const { user, hydrate } = useAuthStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    hydrate();
    setMounted(true);
  }, []);

  if (!mounted) {
    return <>{children}</>;
  }

  const role = user?.role;
  if (role === 'admin' || role === 'super_admin' || role === 'vendor') {
    return (
      <div className="flex min-h-screen bg-zinc-950 text-zinc-100">
        <RoleSidebar />
        <div className="flex-grow flex flex-col overflow-x-hidden min-h-screen">
          {children}
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
