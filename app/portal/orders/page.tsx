import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { PageHead } from '@/components/admin/ui/page-head';
import { StatusPill } from '@/components/admin/ui/status-pill';
import { OrdersSearchInput } from '@/components/portal/orders-search';
import { PerPageSelect } from '@/components/portal/per-page-select';
import { EmptyState } from '@/components/admin/ui/empty-state';
import { TableShell } from '@/components/admin/ui/table-shell';
import { PackageOpen } from 'lucide-react';

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; perPage?: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) return <div className="p-6">Unauthorized</div>;

  const baseWhere =
    user.role === 'ADMIN' || user.role === 'SUPERADMIN'
      ? {}
      : { realtorId: user.realtorId || '__none__' };

  const { page: pageParam, q: qParam, perPage: perPageParam } = await searchParams;
  const q = (qParam || '').trim();
  const where = q
    ? {
        AND: [
          baseWhere,
          { propertyAddress: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : baseWhere;

  const page = Math.max(1, Number(pageParam) || 1);
  const allowedPerPage = [10, 20, 50];
  const perPage = allowedPerPage.includes(Number(perPageParam))
    ? Number(perPageParam)
    : 10;
  const total = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    select: { id: true, slug: true, propertyAddress: true, status: true },
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const qs = (p: number) =>
    `/portal/orders?page=${p}&perPage=${perPage}${q ? `&q=${encodeURIComponent(q)}` : ''}`;

  return (
    <div className="w-full space-y-6">
      <PageHead
        title="My Orders"
        subtitle="View and manage your orders"
        actions={
          <Button asChild className="gap-2">
            <Link href="https://photos4realestate.ca/book-online/" target="_blank">
              + Book Online
            </Link>
          </Button>
        }
      />

      <TableShell
        toolbar={
          <div className="mb-3.5 flex flex-wrap items-center gap-3">
            <PerPageSelect current={perPage} q={q} />
            <div className="ml-auto w-full sm:w-64">
              <OrdersSearchInput initialQ={q} />
            </div>
          </div>
        }
      >
        {orders.length === 0 ? (
          <EmptyState
            icon={PackageOpen}
            title="No orders found"
            description={
              q
                ? 'No orders match your search.'
                : 'Your orders will appear here after you book your first shoot.'
            }
          />
        ) : (
          <table className="w-full">
            <thead>
              <tr>
                <th>Property</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr
                  key={o.id}
                  className="border-b border-border last:border-b-0 hover:bg-surface-2"
                >
                  <td data-label="Property" className="td-primary">
                    <Link
                      href={`/portal/orders/${o.id}`}
                      className="font-medium text-navy-700 hover:underline dark:text-[#9db5f2]"
                    >
                      {o.propertyAddress}
                    </Link>
                  </td>
                  <td data-label="Status">
                    <StatusPill status={o.status} />
                  </td>
                  <td data-label="Actions">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                      <Button variant="outline" asChild size="sm">
                        <Link href={`/portal/orders/${o.id}`}>
                          Order Details
                        </Link>
                      </Button>
                      <Button asChild size="sm">
                        <Link href={`/delivery/${o.id}`} target="_blank">
                          <ExternalLink className="mr-2 h-4 w-4" /> Delivery
                          Page
                        </Link>
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </TableShell>

      {/* Pagination links */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-sm text-muted-foreground">
        <span>
          Page {page} of {totalPages}
        </span>
        <div className="flex gap-2">
          {page > 1 ? (
            <Button variant="outline" asChild size="sm">
              <Link href={qs(page - 1)}>Previous</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Previous
            </Button>
          )}
          {page < totalPages ? (
            <Button variant="outline" asChild size="sm">
              <Link href={qs(page + 1)}>Next</Link>
            </Button>
          ) : (
            <Button variant="outline" size="sm" disabled>
              Next
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
