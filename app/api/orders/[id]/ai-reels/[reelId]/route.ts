import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string; reelId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, reelId } = await params;
    const user = session.user as any;

    // Admin/superadmin only
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const reel = await prisma.orderAiReel.findUnique({ where: { id: reelId } });
    if (!reel || reel.orderId !== id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    await prisma.orderAiReel.delete({ where: { id: reelId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete AI reel' }, { status: 500 });
  }
}
