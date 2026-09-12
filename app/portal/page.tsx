import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import PointsCard from '@/components/portal/PointsCard';
import { OrdersSearchInput } from '@/components/portal/orders-search';
import { PageHead } from '@/components/admin/ui/page-head';
import { StatusPill } from '@/components/admin/ui/status-pill';
import LoginSuccessToaster from '@/components/portal/LoginSuccessToaster';

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; loginSuccess?: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;

  if (!user) {
    return (
      <div className="p-6">
        <p>
          Please{' '}
          <Link href="/login" className="underline">
            sign in
          </Link>
          .
        </p>
      </div>
    );
  }

  const sp = await searchParams;
  const loginSuccess = sp?.loginSuccess;

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';
  if (isAdmin) {
    // Admins land on the dashboard instead of the portal home
    const suffix = loginSuccess ? `?loginSuccess=1` : '';
    redirect(`/admin/dashboard${suffix}`);
  }

  const { q: qParam } = sp;
  const q = (qParam || '').trim();
  const recentLimit = 5;

  const baseWhere = isAdmin ? {} : { realtorId: user.realtorId || '__none__' };
  const where = q
    ? {
        AND: [
          baseWhere,
          { propertyAddress: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : baseWhere;

  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: recentLimit,
    select: { id: true, slug: true, propertyAddress: true, status: true },
  });

  // Fetch points for client (only if user is linked to a Realtor)
  let points = 0;
  if (user.realtorId) {
    const realtor = await prisma.realtor.findUnique({
      where: { id: user.realtorId },
      select: { points: true },
    });
    points = realtor?.points ?? 0;
  }

  return (
    <div className="w-full space-y-6">
      <LoginSuccessToaster />

      <PageHead
        title="Customer Portal"
        subtitle="Access your recent orders and tools"
        actions={
          <Button asChild className="gap-2">
            <Link href="https://photos4realestate.ca/book-online/" target="_blank">
              + Book Online
            </Link>
          </Button>
        }
      />

      <div className="space-y-6">
        {/* Your Points card */}
        {user.realtorId && <PointsCard points={points} />}

        {/* Recent Orders card */}
        <div className="rounded-2xl border border-border bg-card p-4.5 sm:p-6">
          <div className="mb-3 flex items-center gap-3">
            <h2 className="font-display text-[16px] font-semibold">
              Recent Orders
            </h2>
            <div className="ml-auto w-full sm:w-64">
              <OrdersSearchInput initialQ={q} />
            </div>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-muted-foreground">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-border border-t border-border">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex flex-col gap-2.5 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium">
                      {o.propertyAddress}
                    </div>
                    <StatusPill status={o.status} className="mt-0.5" />
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                    <Button variant="outline" asChild size="sm">
                      <Link href={`/portal/orders/${o.id}`}>Order Details</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/delivery/${o.id}`} target="_blank">
                        <ExternalLink className="mr-2 h-4 w-4" /> Delivery Page
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* View All link */}
          <div className="mt-4 text-center">
            <Button variant="outline" asChild size="sm">
              <Link href="/portal/orders">View All Orders</Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
