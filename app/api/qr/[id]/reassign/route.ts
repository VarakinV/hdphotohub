import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';

const schema = z.object({
  orderId: z.string(),
  propertyPageId: z.string().optional().nullable(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await params;
    const user = session.user as any;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    const realtorId = user?.realtorId as string | undefined;

    const qrCode = await prisma.qRCode.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { unassignedAt: null },
        },
      },
    });

    if (!qrCode) {
      return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
    }

    if (!isAdmin) {
      const currentAssignment = qrCode.assignments[0];
      if (!currentAssignment) {
        return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
      }

      const currentOrder = await prisma.order.findUnique({
        where: { id: currentAssignment.orderId },
      });

      if (!currentOrder || currentOrder.realtorId !== realtorId) {
        return NextResponse.json({ error: 'QR code not found' }, { status: 404 });
      }
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
    }

    const newOrder = await prisma.order.findUnique({
      where: { id: parsed.data.orderId },
      include: {
        propertyPages: {
          where: { published: true },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!newOrder) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    if (!isAdmin) {
      if (newOrder.realtorId !== realtorId) {
        return NextResponse.json({ error: 'Cannot reassign to another realtor\'s order' }, { status: 403 });
      }
      if (newOrder.status === 'ARCHIVED') {
        return NextResponse.json({ error: 'Cannot reassign to archived order' }, { status: 400 });
      }
    }

    let propertyPageId = parsed.data.propertyPageId || null;
    if (!propertyPageId && newOrder.propertyPages.length > 0) {
      propertyPageId = newOrder.propertyPages[0].id;
    }

    await prisma.$transaction(async (tx) => {
      const currentAssignment = qrCode.assignments[0];
      if (currentAssignment) {
        await tx.qRAssignment.update({
          where: { id: currentAssignment.id },
          data: { unassignedAt: new Date() },
        });
      }

      await tx.qRAssignment.create({
        data: {
          qrCodeId: qrCode.id,
          orderId: newOrder.id,
          propertyPageId,
          sendWeeklyStats: true,
        },
      });

      await tx.qRCode.update({
        where: { id: qrCode.id },
        data: { status: 'ACTIVE' },
      });
    });

    const updated = await prisma.qRCode.findUnique({
      where: { id },
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            order: {
              include: {
                realtor: true,
              },
            },
            propertyPage: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('[QR REASSIGN]', e);
    return NextResponse.json({ error: 'Failed to reassign QR code' }, { status: 500 });
  }
}
