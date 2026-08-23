import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';
export const maxDuration = 60;

import { prisma } from '@/lib/db/prisma';
import { RemotionProvider } from '@/lib/video/remotion-provider';
import { startRemotionBatch, buildRemotionThumbnailContext } from '@/lib/video/remotion-queue';
import { validateWebhookSignature } from '@remotion/lambda/client';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { remotionPosterFrame } from '@/lib/video/poster';

function mapStatus(s?: string): 'QUEUED' | 'RENDERING' | 'COMPLETE' | 'FAILED' {
  const v = (s || '').toLowerCase();
  if (v.includes('error') || v.includes('fail') || v.includes('timeout')) return 'FAILED';
  if (v.includes('done') || v.includes('success') || v.includes('complete')) return 'COMPLETE';
  if (v.includes('running') || v.includes('render') || v.includes('progress')) return 'RENDERING';
  return 'QUEUED';
}

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = process.env.REMOTION_WEBHOOK_TOKEN;
    if (expected && token !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ ok: true, message: 'Remotion webhook endpoint is reachable (GET).' });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = process.env.REMOTION_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const raw = await req.clone().json().catch(() => null);
    console.log('Remotion webhook raw:', raw);

    // Validate Remotion HMAC signature if a secret is configured
    if (expected) {
      const signatureHeader = req.headers.get('x-remotion-signature') || '';
      try {
        validateWebhookSignature({ secret: expected, body: raw, signatureHeader });
      } catch {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const provider = new RemotionProvider();
    const evt = await provider.parseWebhook(req as unknown as Request);
    console.log('Remotion webhook parsed:', evt);

    const status = mapStatus(evt.status);

    // The render may already be in S3 via outName. If a URL is missing, resolve via Lambda.
    let resolvedUrl = evt.url;
    if (!resolvedUrl && evt.renderId) {
      try {
        const st = await provider.getStatus(evt.renderId);
        resolvedUrl = st.url || resolvedUrl;
      } catch (e) {
        console.warn('Remotion status resolution failed', { renderId: evt.renderId, e });
      }
    }

    // Copy the finished MP4 into photos4remedia if Remotion wrote it to its own
    // remotionlambda-* bucket (lifecycle rules delete those renders after ~1 day).
    if (status === 'COMPLETE' && resolvedUrl && isS3Available()) {
      try {
        const u = new URL(resolvedUrl);
        // Virtual-hosted: remotionlambda-*.s3... Path-style: s3....amazonaws.com/remotionlambda-*/...
        const isRemotionBucket =
          u.hostname.includes('remotionlambda') ||
          u.pathname.startsWith('/remotionlambda');
        if (isRemotionBucket) {
          const reel = await prisma.orderReel.findFirst({
            where: { renderId: evt.renderId, provider: 'remotion' },
            select: { id: true, orderId: true, variantKey: true },
          });
          if (reel) {
            const basePath = `orders/${reel.orderId}/reels/videos`;
            const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.mp4`;
            const resp = await fetch(resolvedUrl);
            if (resp.ok) {
              const ab = await resp.arrayBuffer();
              const buf = Buffer.from(ab);
              const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
              resolvedUrl = fileUrl;
            }
          }
        }
      } catch (e) {
        console.warn('Remotion video S3 copy failed (webhook)', { renderId: evt.renderId, e });
      }
    }

    // Update OrderReel rows
    const updated = await prisma.orderReel.updateMany({
      where: { renderId: evt.renderId, provider: 'remotion' },
      data: {
        status,
        url: resolvedUrl ?? undefined,
        error: status === 'FAILED' ? (evt.error || 'Render failed') : undefined,
      },
    });

    // Poster thumbnail via Remotion still render (ffmpeg is unavailable in Vercel serverless)
    if (status === 'COMPLETE' && resolvedUrl) {
      try {
        const reel = await prisma.orderReel.findFirst({
          where: { renderId: evt.renderId, provider: 'remotion' },
          select: { id: true, orderId: true, variantKey: true, musicTrackId: true, thumbnail: true },
        });
        if (reel && !reel.thumbnail && isS3Available()) {
          const { composition, inputProps } = await buildRemotionThumbnailContext(reel);
          const frame = await remotionPosterFrame(reel.variantKey);
          const buf = await provider.renderThumbnail(composition, inputProps, frame);
          if (buf && buf.length > 0) {
            const basePath = `orders/${reel.orderId}/reels/posters`;
            const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.jpg`;
            const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'image/jpeg');
            await prisma.orderReel.update({ where: { id: reel.id }, data: { thumbnail: fileUrl } });
          }
        }
      } catch (e) {
        console.warn('Remotion poster generation failed', { renderId: evt.renderId, e });
      }
    }

    // Chain the queue: every completion (success or failure) starts the next
    // QUEUED remotion reel. This makes the pipeline self-draining without needing
    // a scheduler, and keeps global concurrency bounded.
    let chained = 0;
    try {
      const res = await startRemotionBatch({ limit: 1 });
      chained = res.started;
    } catch (e) {
      console.warn('Remotion webhook: queue chaining failed', { renderId: evt.renderId, e });
    }

    return NextResponse.json({ ok: true, matched: updated.count, renderId: evt.renderId, status, hasUrl: !!resolvedUrl, chained });
  } catch (e) {
    console.error('Remotion webhook error:', e);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}
