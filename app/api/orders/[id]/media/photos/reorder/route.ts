import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    // Permission: only ADMIN or SUPERADMIN can reorder
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      // Realtors cannot reorder; pretend not found for safety
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length) return NextResponse.json({ error: 'No ids provided' }, { status: 400 });

    // Ensure all ids belong to the specified order (and within admin scope if not SUPERADMIN)
    const whereScope: any = { id: { in: ids }, orderId: id };
    const found = await prisma.photo.findMany({ where: whereScope, select: { id: true } });
    const foundIds = new Set(found.map((f) => f.id));
    const filtered = ids.filter((pid) => foundIds.has(pid));
    if (!filtered.length) return NextResponse.json({ error: 'No matching photos' }, { status: 404 });

    await prisma.$transaction(
      filtered.map((pid, index) =>
        prisma.photo.update({ where: { id: pid }, data: { sortOrder: index } })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to reorder photos' }, { status: 500 });
  }
}

