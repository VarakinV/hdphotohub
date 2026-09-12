import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { ReactNode } from 'react';
import { PortalShell } from '@/components/portal/shell/portal-shell';

export const dynamic = 'force-dynamic';

export default async function PortalLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await auth();
  const user = session?.user as any;

  if (!user) {
    redirect('/login');
  }

  // Admins keep the admin shell; portal users get the portal shell.
  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  return (
    <PortalShell user={user} isAdmin={isAdmin}>
      {children}
    </PortalShell>
  );
}
