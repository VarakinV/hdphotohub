import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;

    // Admin/superadmin only
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const order = await prisma.order.findUnique({ where: { id }, select: { id: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const aiReels = await prisma.orderAiReel.findMany({
      where: { orderId: id },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(aiReels);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch AI reels' }, { status: 500 });
  }
}
