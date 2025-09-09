import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { ExternalLink } from 'lucide-react';
import { PortalNavbar } from '@/components/portal/portal-navbar';

export default async function PortalOrderDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();
  const user = session?.user as any;
  if (!user) return notFound();

  const order = await prisma.order.findUnique({
    where: { id },
    include: { realtor: true },
  });
  if (!order) return notFound();

  if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
    if (!user.realtorId || user.realtorId !== order.realtorId)
      return notFound();
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <PortalNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-2xl font-bold mb-6 break-words">
          {order.propertyAddress}
        </h1>
        <div className="grid gap-6 md:grid-cols-2">
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-medium mb-2">Order Info</h2>
            <ul className="text-sm space-y-1">
              <li>Status: {order.status}</li>
              <li>
                Realtor: {order.realtor.firstName} {order.realtor.lastName}
              </li>
              <li>MLS: {order.mlsNumber || '—'}</li>
              <li>Bedrooms: {order.bedrooms ?? '—'}</li>
              <li>Bathrooms: {order.bathrooms ?? '—'}</li>
              <li>
                List Price:{' '}
                {order.listPrice ? `$${order.listPrice.toLocaleString()}` : '—'}
              </li>
            </ul>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <h2 className="font-medium mb-2">Links</h2>
            <ul className="text-sm list-disc ml-5 space-y-1">
              <li>
                <Button asChild size="sm">
                  <Link href={`/delivery/${order.id}`} target="_blank">
                    <ExternalLink className="h-4 w-4 mr-2" /> Delivery Page
                  </Link>
                </Button>
              </li>
            </ul>
          </div>
        </div>
      </main>
    </div>
  );
}
