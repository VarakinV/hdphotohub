import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const items = await prisma.embed.findMany({
      where: { order: { id, realtor: { userId: session.user.id } } },
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(items);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch embeds' }, { status: 500 });
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
    // body: { title, embedUrl }
    if (!body?.title || !body?.embedUrl) return NextResponse.json({ error: 'Invalid body' }, { status: 400 });

    const created = await prisma.embed.create({ data: { orderId: id, title: body.title, embedUrl: body.embedUrl } });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save embed' }, { status: 500 });
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

    await prisma.embed.deleteMany({ where: { id: { in: ids }, orderId: id, order: { realtor: { userId: session.user.id } } } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete embeds' }, { status: 500 });
  }
}

