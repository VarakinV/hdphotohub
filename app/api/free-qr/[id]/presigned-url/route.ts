import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { getPresignedUploadUrlForPath, isS3Available } from '@/lib/utils/s3';

export const dynamic = 'force-dynamic';

function isAllowedImageType(t?: string) {
  const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/svg+xml'];
  return !!t && allowed.includes(t.toLowerCase());
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const category = String(body.category || 'logo').toLowerCase();
    const fileName = String(body.fileName || 'upload.png');
    const fileType = String(body.fileType || 'image/png');

    if (!isS3Available()) return NextResponse.json({ error: 'S3 not configured' }, { status: 400 });

    const lead = await prisma.freeQrLead.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    if (!isAllowedImageType(fileType)) {
      return NextResponse.json({ error: 'Invalid file type' }, { status: 400 });
    }

    let basePath: string;
    if (category === 'headshot') basePath = `free-qr/${id}/headshot`;
    else basePath = `free-qr/${id}/logo`;

    const { uploadUrl, fileKey, fileUrl } = await getPresignedUploadUrlForPath(basePath, fileName, fileType);

    return NextResponse.json({ uploadUrl, fileKey, fileUrl });
  } catch (e) {
    console.error('free-qr presigned-url failed', e);
    return NextResponse.json({ error: 'Failed to get presigned URL' }, { status: 500 });
  }
}

