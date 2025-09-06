import { NextRequest, NextResponse } from 'next/server';
import sharp from 'sharp';
import { prisma } from '@/lib/db/prisma';
import { uploadBufferToS3WithPath, isS3Available } from '@/lib/utils/s3';

export const dynamic = 'force-dynamic';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    if (!isS3Available()) return NextResponse.json({ error: 'S3 not configured' }, { status: 503 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const onlyMissing: boolean = !!body?.onlyMissing ?? true;

    // Fetch photos for this order
    const photos = await prisma.photo.findMany({ where: { orderId: id } });

    const targets = onlyMissing ? photos.filter(p => !p.urlMls) : photos;
    let updated = 0;

    for (const p of targets) {
      // Fetch original
      const res = await fetch(p.url);
      if (!res.ok) continue;
      const buf = Buffer.from(await res.arrayBuffer());

      // Create MLS 1280 inside (long edge 1280), auto-rotate, JPEG
      const mls = await sharp(buf)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, chromaSubsampling: '4:2:0', mozjpeg: true })
        .toBuffer();

      // Compute target name
      const basePath = `orders/${id}/photos/mls`;
      const name = p.filename.replace(/\.[^.]+$/, '') + '.jpg';

      const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, mls, 'image/jpeg');

      await prisma.photo.update({ where: { id: p.id }, data: { urlMls: fileUrl } });
      updated++;
    }

    return NextResponse.json({ updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to ensure MLS photos' }, { status: 500 });
  }
}

