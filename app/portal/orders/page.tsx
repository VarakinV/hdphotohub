import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { PortalNavbar } from '@/components/portal/portal-navbar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { OrdersSearchInput } from '@/components/portal/orders-search';

import PortalTwoColumnShell from '@/components/portal/PortalTwoColumnShell';

export default async function PortalOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user) return <div className="p-6">Unauthorized</div>;

  const baseWhere =
    user.role === 'ADMIN' || user.role === 'SUPERADMIN'
      ? {}
      : { realtorId: user.realtorId || '__none__' };

  const { page: pageParam, q: qParam } = await searchParams;
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
  const perPage = 20;
  const total = await prisma.order.count({ where });
  const orders = await prisma.order.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    skip: (page - 1) * perPage,
    take: perPage,
    select: { id: true, slug: true, propertyAddress: true, status: true },
  });

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />

      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Orders</h1>
              <p className="text-sm text-gray-600 mt-1">
                View and manage your orders
              </p>
            </div>
            <div>
              <Button asChild className="gap-2">
                <Link href="https://photos4realestate.ca/book-online/">
                  + Book Online
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <PortalTwoColumnShell>
        <div className="bg-white rounded-lg shadow">
          <div className="p-4 border-b flex items-center gap-3">
            <div className="ml-auto w-full sm:w-64">
              <OrdersSearchInput initialQ={q} />
            </div>
          </div>

          <div className="w-full overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Property</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((o) => (
                  <TableRow key={o.id}>
                    <TableCell>{o.propertyAddress}</TableCell>
                    <TableCell>{o.status}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-col sm:flex-row gap-2 sm:justify-end sm:items-center">
                        <Button variant="outline" asChild size="sm">
                          <Link href={`/portal/orders/${o.id}`}>
                            Order Details
                          </Link>
                        </Button>
                        <Button asChild size="sm">
                          <Link href={`/delivery/${o.id}`} target="_blank">
                            <ExternalLink className="h-4 w-4 mr-2" /> Delivery
                            Page
                          </Link>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          <div className="p-4 border-t flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button variant="outline" asChild size="sm">
                  <Link
                    href={`/portal/orders?page=${page - 1}${
                      q ? `&q=${encodeURIComponent(q)}` : ''
                    }`}
                  >
                    Previous
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Previous
                </Button>
              )}
              {page < totalPages ? (
                <Button variant="outline" asChild size="sm">
                  <Link
                    href={`/portal/orders?page=${page + 1}${
                      q ? `&q=${encodeURIComponent(q)}` : ''
                    }`}
                  >
                    Next
                  </Link>
                </Button>
              ) : (
                <Button variant="outline" size="sm" disabled>
                  Next
                </Button>
              )}
            </div>
          </div>
        </div>
      </PortalTwoColumnShell>
    </div>
  );
}
