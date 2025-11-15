import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { deleteFromS3 } from '@/lib/utils/s3';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const me: any = user;
    const isSuper = me?.role === 'SUPERADMIN';
    const isAdmin = me?.role === 'ADMIN';

    const items = await prisma.orderReelSourceImage.findMany({
      where: realtorId
        ? { orderId: id, order: { realtorId } }
        : isSuper
        ? { orderId: id }
        : isAdmin
        ? { orderId: id, order: { realtor: { OR: [{ userId: me.id }, { assignedAdmins: { some: { adminId: me.id } } }] } } }
        : { order: { id, realtor: { userId: session.user.id } } },
      orderBy: [{ sortOrder: 'asc' }, { createdAt: 'asc' }],
    });

    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch reel sources' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const body = await req.json();
    // body: [{ url, filename }]
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    // Enforce max 6 sources per order
    const existingCount = await prisma.orderReelSourceImage.count({ where: { orderId: id } });
    const canAdd = Math.max(0, 6 - existingCount);
    const toInsert = body.slice(0, canAdd);
    if (!toInsert.length) return NextResponse.json({ error: 'Max 6 source images reached' }, { status: 400 });

    // compute starting sortOrder
    const maxOrder = await prisma.orderReelSourceImage.findFirst({
      where: { orderId: id },
      orderBy: { sortOrder: 'desc' },
      select: { sortOrder: true },
    });
    let next = (maxOrder?.sortOrder ?? 0) + 1;

    const created = await prisma.orderReelSourceImage.createMany({
      data: toInsert.map((p: any) => ({ orderId: id, url: p.url, filename: p.filename, sortOrder: next++ })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save reel sources' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const body = await req.json();
    const ids: string[] = body?.ids || [];
    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });

    const me: any = user;
    const isSuper = me?.role === 'SUPERADMIN';
    const isAdmin = me?.role === 'ADMIN';

    const items = await prisma.orderReelSourceImage.findMany({
      where: realtorId
        ? { id: { in: ids }, orderId: id, order: { realtorId } }
        : isSuper
        ? { id: { in: ids }, orderId: id }
        : isAdmin
        ? { id: { in: ids }, orderId: id, order: { realtor: { OR: [{ userId: me.id }, { assignedAdmins: { some: { adminId: me.id } } }] } } }
        : { id: { in: ids }, orderId: id, order: { realtor: { userId: session.user.id } } },
    });

    await prisma.orderReelSourceImage.deleteMany({ where: { id: { in: ids }, orderId: id } });

    await Promise.all(items.map(async (p) => { try { await deleteFromS3(p.url); } catch {} }));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete reel sources' }, { status: 500 });
  }
}

