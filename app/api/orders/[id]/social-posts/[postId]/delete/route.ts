import { NextRequest, NextResponse } from 'next/server';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { deleteFromS3, isS3Available } from '@/lib/utils/s3';

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string; postId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, postId } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const post = await prisma.orderSocialPost.findUnique({ where: { id: postId } });
    if (!post || post.orderId !== id) return NextResponse.json({ error: 'Post not found' }, { status: 404 });

    const order = await prisma.order.findUnique({ where: { id }, select: { realtorId: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (isS3Available() && post.url) {
      try {
        const host = new URL(post.url).hostname || '';
        if (host.includes('s3.amazonaws.com') || host.includes('.s3.')) await deleteFromS3(post.url);
      } catch {}
    }

    await prisma.orderSocialPost.delete({ where: { id: postId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Delete failed' }, { status: 500 });
  }
}
