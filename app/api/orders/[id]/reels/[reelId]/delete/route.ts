import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { ShotstackProvider } from '@/lib/video/shotstack-provider';
import { deleteFromS3, isS3Available } from '@/lib/utils/s3';

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

    // Attempt to delete remote Shotstack assets via Serve API (only for Shotstack provider)
    if ((reel.provider || '').toLowerCase() === 'shotstack') {
      try {
        const provider = new ShotstackProvider();
        await provider.deleteByRenderId(reel.renderId);
      } catch (e) {
        console.warn('Shotstack delete failed (ignored):', e);
      }
    }

    // Delete S3 files if present
    try {
      if (isS3Available()) {
        const urls = [reel.url, reel.thumbnail].filter(Boolean) as string[];
        for (const ustr of urls) {
          try {
            const u = new URL(ustr);
            const host = u.hostname || '';
            const isS3Host = host.includes('s3.amazonaws.com') || host.includes('.s3.');
            if (isS3Host) {
              await deleteFromS3(ustr);
            }
          } catch (e) {
            // ignore URL parse or delete errors
          }
        }
      }
    } catch (e) {
      console.warn('S3 delete failed (ignored):', e);
    }

    // Delete DB record
    await prisma.orderReel.delete({ where: { id: reelId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}

