import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { deleteFromS3, isS3Available } from '@/lib/utils/s3';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; flyerId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, flyerId } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const flyer = await prisma.orderFlyer.findUnique({ where: { id: flyerId } });
    if (!flyer || flyer.orderId !== id) return NextResponse.json({ error: 'Flyer not found' }, { status: 404 });

    // Permission: admin/superadmin or owning realtor
    const order = await prisma.order.findUnique({ where: { id }, select: { realtorId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Delete S3 files if present
    if (isS3Available()) {
      for (const u of [flyer.url, flyer.previewUrl]) {
        if (!u) continue;
        try {
          const host = new URL(u).hostname || '';
          const isS3Host = host.includes('s3.amazonaws.com') || host.includes('.s3.');
          if (isS3Host) await deleteFromS3(u);
        } catch {}
      }
    }

    await prisma.orderFlyer.delete({ where: { id: flyerId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

