import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { OrdersSearchInput } from '@/components/portal/orders-search';
import { PortalNavbar } from '@/components/portal/portal-navbar';

export default async function PortalHomePage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string }>;
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

  const isAdmin = user.role === 'ADMIN' || user.role === 'SUPERADMIN';

  const { page: pageParam, q: qParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);
  const q = (qParam || '').trim();
  const perPage = 10;

  const baseWhere = isAdmin ? {} : { realtorId: user.realtorId || '__none__' };
  const where = q
    ? {
        AND: [
          baseWhere,
          { propertyAddress: { contains: q, mode: 'insensitive' as const } },
        ],
      }
    : baseWhere;

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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow p-4">
          <div className="flex items-center gap-3 mb-3">
            <h2 className="text-lg font-medium">Recent Orders</h2>
            <div className="ml-auto w-full sm:w-64">
              <OrdersSearchInput initialQ={q} />
            </div>
          </div>
          {orders.length === 0 ? (
            <p className="text-sm text-gray-500">No orders yet.</p>
          ) : (
            <ul className="divide-y divide-gray-200 border-t border-gray-200">
              {orders.map((o) => (
                <li
                  key={o.id}
                  className="flex items-center justify-between py-3"
                >
                  <div>
                    <div className="font-medium">{o.propertyAddress}</div>
                    <div className="text-xs text-gray-500">
                      Status: {o.status}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" asChild size="sm">
                      <Link href={`/portal/orders/${o.id}`}>Order Details</Link>
                    </Button>
                    <Button asChild size="sm">
                      <Link href={`/delivery/${o.id}`} target="_blank">
                        <ExternalLink className="h-4 w-4 mr-2" /> Delivery Page
                      </Link>
                    </Button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {/* Pagination */}
          <div className="mt-4 flex items-center justify-between">
            <div className="text-sm text-gray-500">
              Page {page} of {totalPages}
            </div>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button variant="outline" asChild size="sm">
                  <Link
                    href={`/portal?page=${page - 1}${
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
                    href={`/portal?page=${page + 1}${
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
      </main>
    </div>
  );
}
