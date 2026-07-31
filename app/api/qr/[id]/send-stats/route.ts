import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { z } from 'zod';

const schema = z.object({
  sendWeeklyStats: z.boolean(),
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

    const assignment = await prisma.qRAssignment.findUnique({
      where: { id },
      include: {
        qrCode: true,
        order: true,
      },
    });

    if (!assignment || assignment.unassignedAt !== null) {
      return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
    }

    if (!isAdmin) {
      if (assignment.order.realtorId !== realtorId) {
        return NextResponse.json({ error: 'Assignment not found' }, { status: 404 });
      }
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
    }

    const updated = await prisma.qRAssignment.update({
      where: { id },
      data: { sendWeeklyStats: parsed.data.sendWeeklyStats },
      include: {
        order: {
          include: {
            realtor: true,
          },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    console.error('[QR SEND STATS]', e);
    return NextResponse.json({ error: 'Failed to update send stats' }, { status: 500 });
  }
}
