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

    const photos = await prisma.photo.findMany({
      where: realtorId
        ? { orderId: id, order: { realtorId } }
        : { order: { id, realtor: { userId: session.user.id } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(photos);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch photos' }, { status: 500 });
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
    // body: [{ url, urlMls?, filename }]
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const created = await prisma.photo.createMany({
      data: body.map((p) => ({ orderId: id, url: p.url, urlMls: p.urlMls ?? null, filename: p.filename })),
    });

    // Fire-and-forget: ensure MLS sizes for any new photos missing urlMls
    const baseUrl = req.nextUrl.origin;
    try {
      fetch(`${baseUrl}/api/orders/${id}/media/photos/ensure-mls`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ onlyMissing: true }),
      }).catch(() => {});
    } catch {}

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save photos' }, { status: 500 });
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

    // find to delete S3 objects (permission by relation)
    const items = await prisma.photo.findMany({
      where: realtorId
        ? { id: { in: ids }, orderId: id, order: { realtorId } }
        : { id: { in: ids }, orderId: id, order: { realtor: { userId: session.user.id } } },
    });

    await prisma.photo.deleteMany({ where: { id: { in: ids }, orderId: id } });

    await Promise.all(items.map(async (p) => { try { await deleteFromS3(p.url); if (p.urlMls) await deleteFromS3(p.urlMls); } catch {} }));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete photos' }, { status: 500 });
  }
}

