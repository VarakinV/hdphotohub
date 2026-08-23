import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { ShotstackProvider } from '@/lib/video/shotstack-provider';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { RemotionProvider } from '@/lib/video/remotion-provider';
import { startRemotionBatch, buildRemotionThumbnailContext } from '@/lib/video/remotion-queue';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { extractPosterFromVideoUrl, remotionPosterFrame } from '@/lib/video/poster';

function mapStatus(s?: string): 'QUEUED' | 'RENDERING' | 'COMPLETE' | 'FAILED' {
  const v = (s || '').toLowerCase();
  if (v.includes('fail') || v.includes('error')) return 'FAILED';
  if (v.includes('done') || v.includes('complete') || v.includes('ready') || v.includes('success')) return 'COMPLETE';
  if (v.includes('render') || v.includes('progress')) return 'RENDERING';
  return 'QUEUED';
}

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    // Permission: admin/superadmin or owning realtor
    const order = await prisma.order.findUnique({ where: { id }, select: { realtorId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const active = await prisma.orderReel.findMany({
      where: { orderId: id, status: { in: ['QUEUED', 'RENDERING'] } },
      orderBy: { createdAt: 'asc' },
    });

    if (active.length === 0) {
      return NextResponse.json({ ok: true, message: 'No active renders' });
    }

    // Providers will be chosen per reel based on reel.provider

    const updates = await Promise.all(
      active.map(async (reel) => {
        try {
          if (!reel.renderId || reel.renderId === 'pending') return { id: reel.id, skipped: true };
          const st = reel.provider === 'j2v'
            ? await (new J2VProvider()).getStatus(reel.renderId)
            : reel.provider === 'remotion'
              ? await (new RemotionProvider()).getStatus(reel.renderId)
              : await (new ShotstackProvider()).getStatusRobust(reel.renderId);
          const status = mapStatus(st.status);

          // Copy video to S3 if still on a CDN bucket (Shotstack/JSON2Video/Remotion)
          let finalUrl = st.url as string | undefined;
          if (status === 'COMPLETE' && finalUrl && isS3Available()) {
            try {
              const u = new URL(finalUrl);
              const host = u.hostname || '';
              const isShotstackCdn = host.includes('shotstack.io');
              const isJ2V = host.includes('json2video');
              const isRemotionBucket =
                host.includes('remotionlambda') ||
                u.pathname.startsWith('/remotionlambda');
              if (isShotstackCdn || isJ2V || isRemotionBucket) {
                const basePath = `orders/${reel.orderId}/reels/videos`;
                const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
                const name = `${safeVar}-${(reel.renderId || '').slice(0, 8)}.mp4`;
                const resp = await fetch(finalUrl);
                if (resp.ok) {
                  const ab = await resp.arrayBuffer();
                  const buf = Buffer.from(ab);
                  const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
                  finalUrl = fileUrl;
                }
              }
            } catch (e) {
              console.warn('Video S3 copy failed (sync)', { renderId: reel.renderId, e });
            }
          }

          // If complete and URL exists but no thumbnail, try to generate a poster and upload to S3
          let thumbnail = st.thumbnail as string | undefined;
          if (status === 'COMPLETE' && (finalUrl || st.url) && !thumbnail && !reel.thumbnail && isS3Available()) {
            try {
              let buf: Buffer;
              if (reel.provider === 'remotion') {
                const { composition, inputProps } = await buildRemotionThumbnailContext(reel);
                const frame = await remotionPosterFrame(reel.variantKey);
                buf = await new RemotionProvider().renderThumbnail(composition, inputProps, frame);
              } else {
                buf = await extractPosterFromVideoUrl(finalUrl || st.url!, 1);
              }
              if (buf && buf.length > 0) {
                const basePath = `orders/${reel.orderId}/reels/posters`;
                const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
                const name = `${safeVar}-${(reel.renderId || '').slice(0, 8)}.jpg`;
                const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'image/jpeg');
                thumbnail = fileUrl;
              }
            } catch (e) {
              console.warn('Poster generation (sync) failed', { renderId: reel.renderId, e });
            }
          }

          await prisma.orderReel.update({
            where: { id: reel.id },
            data: {
              status,
              url: finalUrl ?? st.url ?? undefined,
              thumbnail: thumbnail ?? undefined,
              width: st.width ?? undefined,
              height: st.height ?? undefined,
              error: status === 'FAILED' ? (st as any).error || reel.error || 'Render failed' : undefined,
            },
          });
          return { id: reel.id, status, hasUrl: !!(finalUrl ?? st.url), hasThumbnail: !!thumbnail };
        } catch (e: any) {
          // A status lookup failure (config/transient) should not kill a render
          // that may still be running. Keep the current status and retry next poll.
          if (reel.status === 'QUEUED' || reel.status === 'RENDERING') {
            console.warn('Reel status lookup failed, keeping current status', { id: reel.id, renderId: reel.renderId, e });
            return { id: reel.id, status: reel.status };
          }
          await prisma.orderReel.update({
            where: { id: reel.id },
            data: { status: 'FAILED', error: String(e?.message || e) },
          });
          return { id: reel.id, status: 'FAILED' };
        }
      })
    );

    // Drive the Remotion queue as a safety net: start QUEUED reels for this order
    // that were never picked up (e.g. no webhook fired). Claiming is atomic, so a
    // concurrent runner (generate/webhook) starting the same reel is a no-op.
    let queueStarted = 0;
    try {
      const q = await startRemotionBatch({ limit: 1, orderId: id });
      queueStarted = q.started;
    } catch (e) {
      console.warn('Sync: Remotion queue kick failed', { id, e });
    }

    return NextResponse.json({ ok: true, count: updates.length, updates, queueStarted });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to sync reels' }, { status: 500 });
  }
}

