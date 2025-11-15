import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === 'ADMIN' || me.role === 'SUPERADMIN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const start = searchParams.get('start');
    const end = searchParams.get('end');
    const q = searchParams.get('q') || undefined;

    const where: any = {};
    if (start || end) {
      where.createdAt = {
        ...(start ? { gte: new Date(start) } : {}),
        ...(end ? { lte: new Date(end) } : {}),
      };
    }
    if (q) {
      where.OR = [
        { propertyAddress: { contains: q, mode: 'insensitive' } },
        { firstName: { contains: q, mode: 'insensitive' } },
        { lastName: { contains: q, mode: 'insensitive' } },
        { email: { contains: q, mode: 'insensitive' } },
      ];
    }

    const rows = await prisma.freeFlyersLead.findMany({
      where,
      orderBy: [{ createdAt: 'desc' }],
      select: {
        id: true,
        createdAt: true,
        propertyAddress: true,
        firstName: true,
        lastName: true,
        email: true,
        status: true,
      },
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error('Failed to fetch free flyers leads', e);
    return NextResponse.json({ error: 'Failed to fetch free flyers leads' }, { status: 500 });
  }
}

