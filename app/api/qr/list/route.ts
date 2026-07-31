import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const user = session.user as any;
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    const realtorId = user?.realtorId as string | undefined;

    const where = isAdmin
      ? {}
      : {
          assignments: {
            some: {
              order: {
                realtorId,
              },
              unassignedAt: null,
            },
          },
        };

    const qrCodes = await prisma.qRCode.findMany({
      where,
      include: {
        assignments: {
          where: { unassignedAt: null },
          include: {
            order: {
              include: {
                realtor: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                    email: true,
                  },
                },
              },
            },
            propertyPage: true,
          },
        },
        printables: {
          orderBy: { createdAt: 'asc' },
        },
        createdByUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(qrCodes);
  } catch (e) {
    console.error('[QR LIST]', e);
    return NextResponse.json({ error: 'Failed to fetch QR codes' }, { status: 500 });
  }
}
