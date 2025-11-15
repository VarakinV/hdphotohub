import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; reelId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, reelId } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const reel = await prisma.orderReel.findUnique({ where: { id: reelId } });
    if (!reel || reel.orderId !== id) return NextResponse.json({ error: 'Reel not found' }, { status: 404 });

    // Permission: admin/superadmin or owning realtor
    const order = await prisma.order.findUnique({ where: { id }, select: { realtorId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (reel.status === 'COMPLETE') return NextResponse.json({ error: 'Cannot cancel a completed reel' }, { status: 400 });

    await prisma.orderReel.update({ where: { id: reelId }, data: { status: 'FAILED', error: 'Cancelled by user' } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Cancel failed' }, { status: 500 });
  }
}

