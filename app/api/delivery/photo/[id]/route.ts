import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import sharp from 'sharp';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const url = new URL(req.url);
    const variant = url.searchParams.get('variant') === 'mls' ? 'mls' : 'original';
    const requestedName = url.searchParams.get('filename') || undefined;

    const photo = await prisma.photo.findUnique({ where: { id }, include: { order: true } });
    if (!photo || photo.order.status !== 'PUBLISHED') {
      return new NextResponse('Not found', { status: 404 });
    }

    // Determine target URL or generate MLS on the fly
    if (variant === 'mls') {
      if (photo.urlMls) {
        return await proxyDownload(photo.urlMls, requestedName || toMlsName(photo.filename));
      }
      // Fallback: generate MLS now
      const srcRes = await fetch(photo.url);
      if (!srcRes.ok) return new NextResponse('Source not available', { status: 502 });
      const srcBuf = Buffer.from(await srcRes.arrayBuffer());
      const mls = await sharp(srcBuf)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, chromaSubsampling: '4:2:0', mozjpeg: true })
        .toBuffer();

      // Best-effort: upload and persist urlMls for future
      try {
        if (isS3Available()) {
          const basePath = `orders/${photo.orderId}/photos/mls`;
          const base = stripExt(photo.filename);
          const name = `${base}.jpg`;
          const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, mls, 'image/jpeg');
          await prisma.photo.update({ where: { id: photo.id }, data: { urlMls: fileUrl } });
        }
      } catch {}

      return blobResponse(mls, requestedName || toMlsName(photo.filename), 'image/jpeg');
    }

    // Original
    return await proxyDownload(photo.url, requestedName || photo.filename);
  } catch (e) {
    console.error(e);
    return new NextResponse('Failed', { status: 500 });
  }
}

function stripExt(name: string) {
  return name.replace(/\.[^.]+$/, '');
}
function toMlsName(filename: string) {
  return `${stripExt(filename)}-mls.jpg`;
}

async function proxyDownload(sourceUrl: string, filename: string) {
  const res = await fetch(sourceUrl);
  if (!res.ok) return new NextResponse('Upstream fetch failed', { status: 502 });
  const buf = Buffer.from(await res.arrayBuffer());
  const contentType = res.headers.get('content-type') || 'application/octet-stream';
  return blobResponse(buf, filename, contentType);
}

function blobResponse(buf: Buffer | Uint8Array, filename: string, contentType: string) {
  // Use a Blob to satisfy BodyInit across environments
  const body = new Blob([new Uint8Array(buf as Uint8Array)], { type: contentType });
  return new Response(body, {
    status: 200,
    headers: {
      'Content-Type': contentType,
      'Content-Disposition': `attachment; filename="${sanitizeFilename(filename)}"`,
      'Cache-Control': 'no-store',
    },
  });
}

function sanitizeFilename(name: string) {
  return name.replace(/[^A-Za-z0-9._-]/g, '_');
}

