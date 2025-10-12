'use client';

import { ReactNode } from 'react';
import PortalNavCard from '@/components/portal/portal-nav-card';

export default function PortalTwoColumnShell({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
        <div className="md:col-span-3">
          <PortalNavCard />
        </div>
        <section className="md:col-span-9 space-y-6">{children}</section>
      </div>
    </div>
  );
}
