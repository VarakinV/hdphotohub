import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const templates = await prisma.socialPostTemplate.findMany({
      orderBy: { sortOrder: 'asc' },
    });
    const counts = await prisma.orderSocialPost.groupBy({
      by: ['variantKey'],
      _count: { _all: true },
    });
    const countMap = new Map(counts.map((c) => [c.variantKey, c._count._all]));
    return NextResponse.json(
      templates.map((t) => ({ ...t, _count: { posts: countMap.get(t.variantKey) ?? 0 } }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch social templates' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (session.user.role !== 'ADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const { id, status, label } = body || {};
    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (status !== undefined && !['draft', 'active'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const data: any = {};
    if (status !== undefined) data.status = status;
    if (label !== undefined) data.label = label;
    const updated = await prisma.socialPostTemplate.update({ where: { id }, data });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Update failed' }, { status: 500 });
  }
}
