import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { getOrderMediaPresignedUrl, isS3Available } from '@/lib/utils/s3';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isS3Available()) return NextResponse.json({ error: 'S3 not configured' }, { status: 503 });

    const { id } = await params;

    // ensure order belongs to current user via realtor.userId
    const order = await prisma.order.findFirst({ where: { id, realtor: { userId: session.user.id } } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const { category, fileName, fileType } = await req.json();
    if (!category || !fileName || !fileType) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    if (!['photos', 'videos', 'floorplans', 'attachments'].includes(category)) {
      return NextResponse.json({ error: 'Invalid category' }, { status: 400 });
    }

    const data = await getOrderMediaPresignedUrl(id, category, fileName, fileType);
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create presigned URL' }, { status: 500 });
  }
}

