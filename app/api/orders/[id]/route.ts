import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { deleteFromS3 } from '@/lib/utils/s3';

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
        propertyFormattedAddress: body.propertyFormattedAddress ?? null,
        propertyLat: body.propertyLat ?? null,
        propertyLng: body.propertyLng ?? null,
        propertySize: body.propertySize ?? null,
        yearBuilt: body.yearBuilt ?? null,
        mlsNumber: body.mlsNumber ?? null,
        listPrice: body.listPrice ?? null,
        bedrooms: body.bedrooms ?? null,
        bathrooms: body.bathrooms ?? null,
        featuresText: body.featuresText ?? null,
        description: body.description ?? null,
        status: body.status ?? undefined,
      },
      include: { realtor: { select: { id: true, firstName: true, lastName: true } } },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update order' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;

    // Verify ownership
    const order = await prisma.order.findFirst({ where: { id, realtor: { userId: session.user.id } } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Fetch related media to delete from S3
    const [photos, videos, floors, attaches] = await Promise.all([
      prisma.photo.findMany({ where: { orderId: id } }),
      prisma.video.findMany({ where: { orderId: id } }),
      prisma.floorPlan.findMany({ where: { orderId: id } }),
      prisma.attachment.findMany({ where: { orderId: id } }),
    ]);

    // Best-effort S3 cleanup (non-blocking failures)
    await Promise.all([
      ...photos.map(async (p) => { try { await deleteFromS3(p.url); if (p.urlMls) await deleteFromS3(p.urlMls); } catch {} }),
      ...videos.map(async (v) => { try { await deleteFromS3(v.url); } catch {} }),
      ...floors.map(async (f) => { try { await deleteFromS3(f.url); } catch {} }),
      ...attaches.map(async (a) => { try { await deleteFromS3(a.url); } catch {} }),
    ]);

    // Delete DB records in a transaction
    await prisma.$transaction([
      prisma.photo.deleteMany({ where: { orderId: id } }),
      prisma.video.deleteMany({ where: { orderId: id } }),
      prisma.floorPlan.deleteMany({ where: { orderId: id } }),
      prisma.attachment.deleteMany({ where: { orderId: id } }),
      prisma.embed.deleteMany({ where: { orderId: id } }),
      prisma.order.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete order' }, { status: 500 });
  }
}
