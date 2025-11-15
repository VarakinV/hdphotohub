import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { prisma } from '@/lib/db/prisma';
import { ShotstackProvider } from '@/lib/video/shotstack-provider';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { extractPosterFromVideoUrl } from '@/lib/video/poster';

function mapStatus(s?: string): 'QUEUED' | 'RENDERING' | 'COMPLETE' | 'FAILED' {
  const v = (s || '').toLowerCase();
  if (v.includes('fail') || v.includes('error')) return 'FAILED';
  if (v.includes('done') || v.includes('complete') || v.includes('ready') || v.includes('success')) return 'COMPLETE';
  if (v.includes('render') || v.includes('progress')) return 'RENDERING';
  return 'QUEUED';
}
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = process.env.SHOTSTACK_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    return NextResponse.json({ ok: true, message: 'Shotstack webhook endpoint is reachable (GET).' });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}


export async function POST(req: NextRequest) {
  try {
    // Optional shared secret check
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = process.env.SHOTSTACK_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = new ShotstackProvider();

    // Log raw to aid troubleshooting varying payload shapes
    const raw = await req.clone().json().catch(() => null);
    console.log('Shotstack webhook raw:', raw);

    const evt = await provider.parseWebhook(req as unknown as Request);
    console.log('Shotstack webhook parsed:', evt);

    let status = mapStatus(evt.status);

    // Source of truth: ask Shotstack for the latest status/output in case the webhook payload doesn't include URLs
    let resolved = {
      url: evt.url as string | undefined,
      thumbnail: evt.thumbnail as string | undefined,
      width: evt.width as number | undefined,
      height: evt.height as number | undefined,
    };
    // Only call provider status when webhook didn't include a URL
    if (!resolved.url) {
      try {
        const st = await (async () => {
          try {
            return await new ShotstackProvider().getStatusRobust(evt.renderId);
          } catch (e) {
            console.warn('Shotstack getStatus failed', { renderId: evt.renderId, e });
            return undefined;
          }
        })();
        if (st) {
          status = st.status ? mapStatus(st.status) : status;
          resolved = {
            url: st.url || resolved.url,
            thumbnail: st.thumbnail || resolved.thumbnail,
            width: st.width || resolved.width,
            height: st.height || resolved.height,
          };
        }
      } catch (e) {
        console.warn('Status resolution error', e);
      }
    }

    // Persist video to S3 if it's still on Shotstack CDN (24h temp)
    if (status === 'COMPLETE' && resolved.url && isS3Available()) {
      try {
        const u = new URL(resolved.url);
        const isShotstackCdn = u.hostname.includes('shotstack.io');
        if (isShotstackCdn) {
          const reel = await prisma.orderReel.findFirst({
            where: { renderId: evt.renderId, provider: 'shotstack' },
            select: { id: true, orderId: true, variantKey: true },
          });
          if (reel) {
            const basePath = `orders/${reel.orderId}/reels/videos`;
            const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.mp4`;
            const resp = await fetch(resolved.url);
            if (resp.ok) {
              const ab = await resp.arrayBuffer();
              const buf = Buffer.from(ab);
              const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
              resolved.url = fileUrl; // switch to permanent S3 URL
            }
          }
        }
      } catch (e) {
        console.warn('Video S3 copy failed (webhook)', { renderId: evt.renderId, e });
      }
    }

    // Generate a poster if we have a URL but no thumbnail yet
    if (status === 'COMPLETE' && resolved.url && !resolved.thumbnail) {
      try {
        const reel = await prisma.orderReel.findFirst({
          where: { renderId: evt.renderId, provider: 'shotstack' },
          select: { id: true, orderId: true, variantKey: true, thumbnail: true },
        });
        if (reel && !reel.thumbnail && isS3Available()) {
          const buf = await extractPosterFromVideoUrl(resolved.url);
          if (buf && buf.length > 0) {
            const basePath = `orders/${reel.orderId}/reels/posters`;
            const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.jpg`;
            const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'image/jpeg');
            resolved.thumbnail = fileUrl;
          }
        }
      } catch (e) {
        console.warn('Poster generation failed', { renderId: evt.renderId, e });
      }
    }

    const updated = await prisma.orderReel.updateMany({
      where: { renderId: evt.renderId, provider: 'shotstack' },
      data: {
        status,
        url: resolved.url ?? undefined,
        thumbnail: resolved.thumbnail ?? undefined,
        width: resolved.width ?? undefined,
        height: resolved.height ?? undefined,
        error: status === 'FAILED' ? (evt as any).error || 'Render failed' : undefined,
      },
    });

    return NextResponse.json({ ok: true, matched: updated.count, renderId: evt.renderId, status, hasUrl: !!resolved.url, hasThumbnail: !!resolved.thumbnail });
  } catch (e) {
    console.error('Shotstack webhook error:', e);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

