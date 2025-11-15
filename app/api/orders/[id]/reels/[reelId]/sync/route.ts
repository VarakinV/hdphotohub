import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { extractPosterFromVideoUrl } from '@/lib/video/poster';

export const runtime = 'nodejs';

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

    if (reel.status !== 'COMPLETE' || !reel.url) {
      return NextResponse.json({ error: 'Reel must be COMPLETE with a URL' }, { status: 400 });
    }

    if (!isS3Available()) {
      return NextResponse.json({ error: 'S3 is not configured' }, { status: 400 });
    }

    let updatedUrl = reel.url;
    try {
      const u = new URL(reel.url);
      const host = u.hostname || '';
      const isExternalCdn = host.includes('shotstack.io') || host.includes('json2video');
      if (isExternalCdn) {
        const basePath = `orders/${reel.orderId}/reels/videos`;
        const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
        const name = `${safeVar}-${(reel.renderId || '').slice(0, 8)}.mp4`;
        const resp = await fetch(reel.url);
        if (!resp.ok) throw new Error(`Failed to fetch Shotstack URL: ${resp.status}`);
        const buf = Buffer.from(await resp.arrayBuffer());
        const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
        updatedUrl = fileUrl;
      }
    } catch (e) {
      console.warn('Per-reel sync: video copy failed', { renderId: reel.renderId, e });
    }

    let thumbnail = reel.thumbnail as string | null;
    if (!thumbnail) {
      try {
        const posterBuf = await extractPosterFromVideoUrl(updatedUrl);
        if (posterBuf && posterBuf.length > 0) {
          const basePath = `orders/${reel.orderId}/reels/posters`;
          const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
          const name = `${safeVar}-${(reel.renderId || '').slice(0, 8)}.jpg`;
          const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, posterBuf, 'image/jpeg');
          thumbnail = fileUrl;
        }
      } catch (e) {
        console.warn('Per-reel sync: poster generation failed', { renderId: reel.renderId, e });
      }
    }

    await prisma.orderReel.update({ where: { id: reel.id }, data: { url: updatedUrl, thumbnail: thumbnail ?? undefined } });
    return NextResponse.json({ ok: true, url: updatedUrl, thumbnail });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Sync storage failed' }, { status: 500 });
  }
}

