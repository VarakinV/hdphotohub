import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const items: { id: string; sortOrder: number }[] = body?.items || [];
    if (!Array.isArray(items) || !items.length) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    // Permission: allow admin/superadmin or owning realtor
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;
    const me: any = user;
    const isSuper = me?.role === 'SUPERADMIN';
    const isAdmin = me?.role === 'ADMIN';

    const ids = items.map((i) => i.id);
    const existing = await prisma.orderReelSourceImage.findMany({
      where: realtorId
        ? { id: { in: ids }, orderId: id, order: { realtorId } }
        : isSuper
        ? { id: { in: ids }, orderId: id }
        : isAdmin
        ? { id: { in: ids }, orderId: id, order: { realtor: { OR: [{ userId: me.id }, { assignedAdmins: { some: { adminId: me.id } } }] } } }
        : { id: { in: ids }, orderId: id, order: { realtor: { userId: session.user.id } } },
      select: { id: true },
    });

    const existingIds = new Set(existing.map((x) => x.id));
    const updates = items.filter((i) => existingIds.has(i.id));

    await prisma.$transaction(
      updates.map((u) =>
        prisma.orderReelSourceImage.update({ where: { id: u.id }, data: { sortOrder: u.sortOrder } })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to reorder' }, { status: 500 });
  }
}

