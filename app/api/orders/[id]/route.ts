import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const order = await prisma.order.findFirst({
      where: { id, realtor: { userId: session.user.id } },
      include: { realtor: { select: { id: true, firstName: true, lastName: true } } },
    });

    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    return NextResponse.json(order);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch order' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;

    const body = await req.json();

    // Only allow updates to property data and status for now
    const updated = await prisma.order.update({
      where: { id },
      data: {
        propertyAddress: body.propertyAddress,
        propertySize: body.propertySize ?? null,
        yearBuilt: body.yearBuilt ?? null,
        mlsNumber: body.mlsNumber ?? null,
        listPrice: body.listPrice ?? null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        description: body.description ?? null,
        status: body.status,
      },
      include: { realtor: { select: { id: true, firstName: true, lastName: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

