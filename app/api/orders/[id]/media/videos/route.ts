import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { deleteFromS3 } from '@/lib/utils/s3';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const videos = await prisma.video.findMany({
      where: { order: { id, realtor: { userId: session.user.id } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(videos);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch videos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findFirst({ where: { id, realtor: { userId: session.user.id } } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const body = await req.json();
    // body: [{ url, filename }]
    if (!Array.isArray(body)) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const created = await prisma.video.createMany({
      data: body.map((p) => ({ orderId: id, url: p.url, filename: p.filename })),
    });

    return NextResponse.json({ count: created.count }, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save videos' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const body = await req.json();
    const ids: string[] = body?.ids || [];
    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });

    const items = await prisma.video.findMany({ where: { id: { in: ids }, orderId: id, order: { realtor: { userId: session.user.id } } } });

    await prisma.video.deleteMany({ where: { id: { in: ids }, orderId: id } });

    await Promise.all(items.map(async (p) => { try { await deleteFromS3(p.url); } catch {} }));

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete videos' }, { status: 500 });
  }
}
