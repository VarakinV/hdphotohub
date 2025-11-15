import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { prisma } from '@/lib/db/prisma';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { extractPosterFromVideoUrl } from '@/lib/video/poster';

function mapStatus(s?: string): 'QUEUED' | 'RENDERING' | 'COMPLETE' | 'FAILED' {
  const v = (s || '').toLowerCase();
  if (v.includes('error') || v.includes('fail')) return 'FAILED';
  if (v.includes('done') || v.includes('success') || v.includes('complete')) return 'COMPLETE';
  if (v.includes('running') || v.includes('render')) return 'RENDERING';
  return 'QUEUED';
}

export async function GET(req: NextRequest) {
  // Optional diagnostic endpoint
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = process.env.JSON2VIDEO_WEBHOOK_TOKEN;
    if (expected && token !== expected) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    return NextResponse.json({ ok: true, message: 'JSON2Video webhook endpoint is reachable (GET).' });
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  try {
    // Optional shared secret check
    const url = new URL(req.url);
    const token = url.searchParams.get('token');
    const expected = process.env.JSON2VIDEO_WEBHOOK_TOKEN;
    if (expected && token !== expected) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const provider = new J2VProvider();

    // Log raw to aid troubleshooting
    const raw = await req.clone().json().catch(() => null);
    console.log('J2V webhook raw:', raw);

    const evt = await provider.parseWebhook(req as unknown as Request);
    console.log('J2V webhook parsed:', evt);

    // Resolve latest status via GET if needed
    let status = mapStatus(evt.status);
    let resolved = { url: evt.url as string | undefined, width: evt.width, height: evt.height, duration: evt.duration };
    if (!resolved.url && evt.renderId) {
      try {
        const st = await provider.getStatus(evt.renderId);
        status = st.status ? mapStatus(st.status) : status;
        resolved = { url: st.url || resolved.url, width: st.width || resolved.width, height: st.height || resolved.height, duration: st.duration || resolved.duration };
      } catch (e) {
        console.warn('J2V status resolution failed', { renderId: evt.renderId, e });
      }
    }

    // Persist to S3 if URL points to JSON2Video CDN
    if (status === 'COMPLETE' && resolved.url && isS3Available()) {
      try {
        const u = new URL(resolved.url);
        const isJ2V = u.hostname.includes('json2video');
        if (isJ2V) {
          // Try OrderReel first
          const reel = await prisma.orderReel.findFirst({ where: { renderId: evt.renderId, provider: 'j2v' }, select: { id: true, orderId: true, variantKey: true } });
          if (reel) {
            const basePath = `orders/${reel.orderId}/reels/videos`;
            const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.mp4`;
            const resp = await fetch(resolved.url);
            if (resp.ok) {
              const ab = await resp.arrayBuffer();
              const buf = Buffer.from(ab);
              const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
              resolved.url = fileUrl;
            }
          } else {
            // Fallback to FreeReel
            const free = await prisma.freeReel.findFirst({ where: { renderId: evt.renderId, provider: 'j2v' }, select: { id: true, leadId: true, variantKey: true } });
            if (free) {
              const basePath = `free-reels/${free.leadId}/videos`;
              const safeVar = (free.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
              const name = `${safeVar}-${evt.renderId.slice(0, 8)}.mp4`;
              const resp = await fetch(resolved.url);
              if (resp.ok) {
                const ab = await resp.arrayBuffer();
                const buf = Buffer.from(ab);
                const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'video/mp4');
                resolved.url = fileUrl;
              }
            }
          }
        }
      } catch (e) {
        console.warn('J2V Video S3 copy failed (webhook)', { renderId: evt.renderId, e });
      }
    }

    // Generate poster if missing
    if (status === 'COMPLETE' && resolved.url) {
      try {
        // Order reels
        const reel = await prisma.orderReel.findFirst({ where: { renderId: evt.renderId, provider: 'j2v' }, select: { id: true, orderId: true, variantKey: true, thumbnail: true } });
        if (reel && !reel.thumbnail && isS3Available()) {
          const buf = await extractPosterFromVideoUrl(resolved.url);
          if (buf && buf.length > 0) {
            const basePath = `orders/${reel.orderId}/reels/posters`;
            const safeVar = (reel.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.jpg`;
            const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'image/jpeg');
            await prisma.orderReel.update({ where: { id: reel.id }, data: { thumbnail: fileUrl } });
          }
        }
        // Free reels
        const free = await prisma.freeReel.findFirst({ where: { renderId: evt.renderId, provider: 'j2v' }, select: { id: true, leadId: true, variantKey: true, thumbnail: true } });
        if (free && !free.thumbnail && isS3Available()) {
          const buf = await extractPosterFromVideoUrl(resolved.url);
          if (buf && buf.length > 0) {
            const basePath = `free-reels/${free.leadId}/posters`;
            const safeVar = (free.variantKey || 'reel').replace(/[^A-Za-z0-9_-]/g, '_');
            const name = `${safeVar}-${evt.renderId.slice(0, 8)}.jpg`;
            const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, buf, 'image/jpeg');
            await prisma.freeReel.update({ where: { id: free.id }, data: { thumbnail: fileUrl } });
          }
        }
      } catch (e) {
        console.warn('J2V Poster generation failed', { renderId: evt.renderId, e });
      }
    }

    const updatedOrder = await prisma.orderReel.updateMany({ where: { renderId: evt.renderId, provider: 'j2v' }, data: { status, url: resolved.url ?? undefined, width: resolved.width ?? undefined, height: resolved.height ?? undefined, error: status === 'FAILED' ? 'Render failed' : undefined } });
    const updatedFree = await prisma.freeReel.updateMany({ where: { renderId: evt.renderId, provider: 'j2v' }, data: { status, url: resolved.url ?? undefined, width: resolved.width ?? undefined, height: resolved.height ?? undefined, error: status === 'FAILED' ? 'Render failed' : undefined } });

    // If a free reel became COMPLETE, check if all for that lead are done
    if (status === 'COMPLETE' && updatedFree.count > 0) {
      const fr = await prisma.freeReel.findFirst({ where: { renderId: evt.renderId, provider: 'j2v' }, select: { leadId: true } });
      if (fr) {
        const remaining = await prisma.freeReel.count({ where: { leadId: fr.leadId, status: { in: ['QUEUED', 'RENDERING'] } } });
        if (remaining === 0) {
          await prisma.freeReelsLead.update({ where: { id: fr.leadId }, data: { status: 'COMPLETE' } });
        }
      }
    }

    return NextResponse.json({ ok: true, matched: updatedOrder.count + updatedFree.count, renderId: evt.renderId, status, hasUrl: !!resolved.url });
  } catch (e) {
    console.error('J2V webhook error:', e);
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 });
  }
}

