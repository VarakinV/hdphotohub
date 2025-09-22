import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
import { PortalNavbar } from '@/components/portal/portal-navbar';
import { PortalOrderDetails } from '@/components/portal/PortalOrderDetails';

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
        <PortalOrderDetails orderId={id} />
      </main>
    </div>
  );
}
