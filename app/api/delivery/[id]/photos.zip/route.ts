import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import JSZip from 'jszip';
import sharp from 'sharp';
import { uploadBufferToS3WithPath, isS3Available } from '@/lib/utils/s3';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const variant = req.nextUrl.searchParams.get('variant') === 'mls' ? 'mls' : 'original';

    const order = await prisma.order.findUnique({ where: { id }, include: { photos: true } });
    if (!order) return new NextResponse('Not found', { status: 404 });

    const zip = new JSZip();

    // Add original file to zip
    const addOriginal = async (url: string, name: string) => {
      const res = await fetch(url);
      if (!res.ok) return;
      const arrayBuf = await res.arrayBuffer();
      zip.file(name, arrayBuf);
    };

    // Add MLS-resized file to zip; fallback resize if missing
    const addMls = async (photo: { id: string; url: string; urlMls: string | null; filename: string }) => {
      if (photo.urlMls) {
        return addOriginal(photo.urlMls, photo.filename);
      }
      // Fallback: resize on the fly
      const res = await fetch(photo.url);
      if (!res.ok) return;
      const buf = Buffer.from(await res.arrayBuffer());
      const mls = await sharp(buf)
        .rotate()
        .resize({ width: 1280, height: 1280, fit: 'inside', withoutEnlargement: true })
        .jpeg({ quality: 82, chromaSubsampling: '4:2:0', mozjpeg: true })
        .toBuffer();
      // Use original filename (keeps UI simple). Could switch to .jpg extension if preferred.
      zip.file(photo.filename, mls);
      // Write-through cache to S3 and DB (best-effort)
      try {
        if (isS3Available()) {
          const basePath = `orders/${id}/photos/mls`;
          const baseName = photo.filename.replace(/\.[^.]+$/, '');
          const name = `${baseName}.jpg`;
          const { fileUrl } = await uploadBufferToS3WithPath(basePath, name, mls, 'image/jpeg');
          await prisma.photo.update({ where: { id: photo.id }, data: { urlMls: fileUrl } });
        }
      } catch {}
    };

    const tasks = order.photos.map((p) =>
      variant === 'mls' ? addMls(p) : addOriginal(p.url, p.filename)
    );
    await Promise.all(tasks);

    const content = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });

    return new NextResponse(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="photos-${variant}.zip"`,
      },
    });
  } catch (e) {
    console.error(e);
    return new NextResponse('Failed to zip', { status: 500 });
  }
}

