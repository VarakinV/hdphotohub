import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { notFound } from 'next/navigation';
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
    <div className="w-full">
      <PortalOrderDetails orderId={id} />
    </div>
  );
}
