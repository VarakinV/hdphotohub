import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const order = await prisma.order.findUnique({ where: { id }, select: { realtorId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const posts = await prisma.orderSocialPost.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'asc' },
    });
    return NextResponse.json(posts);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch social posts' }, { status: 500 });
  }
}
