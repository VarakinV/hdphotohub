'use client';

import { ReactNode, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Loader2 } from 'lucide-react';
import { AdminSidebar, SIDEBAR_COLLAPSED_KEY } from './admin-sidebar';
import { AdminTopbar } from './admin-topbar';

export function AdminShell({ children }: { children: ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (status === 'loading') return;
    if (!session?.user) {
      router.push('/login');
    }
  }, [session, status, router]);

  useEffect(() => {
    try {
      setCollapsed(localStorage.getItem(SIDEBAR_COLLAPSED_KEY) === '1');
    } catch {}
  }, []);

  // Close the mobile drawer when resizing to desktop
  useEffect(() => {
    const onResize = () => {
      if (window.innerWidth >= 1024) setMobileOpen(false);
    };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function toggleCollapse() {
    setCollapsed((v) => {
      try {
        localStorage.setItem(SIDEBAR_COLLAPSED_KEY, v ? '0' : '1');
      } catch {}
      return !v;
    });
  }

  if (status === 'loading' || !session?.user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-7 w-7 animate-spin text-faint" />
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <AdminSidebar
        collapsed={collapsed}
        mobileOpen={mobileOpen}
        onToggleCollapse={toggleCollapse}
        onCloseMobile={() => setMobileOpen(false)}
      />
      <div className={`min-h-screen transition-[margin] duration-200 ${collapsed ? 'lg:ml-20' : 'lg:ml-[264px]'}`}>
        <AdminTopbar onOpenMobile={() => setMobileOpen(true)} />
        <main className="mx-auto w-full max-w-[1600px] px-4 pb-16 pt-5 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
