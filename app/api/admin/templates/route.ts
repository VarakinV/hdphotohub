import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

function isAdminRole(role?: string) {
  return role === 'ADMIN' || role === 'SUPERADMIN';
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdminRole((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const templates = await prisma.videoTemplate.findMany({
      orderBy: [{ status: 'asc' }, { variantKey: 'asc' }],
      include: {
        defaultMusicTrack: { select: { id: true, name: true, fileUrl: true, duration: true } },
      },
    });

    const reelCounts = await prisma.orderReel.groupBy({
      by: ['variantKey'],
      where: { provider: 'remotion' },
      _count: { _all: true },
    });
    const countMap = new Map(reelCounts.map((r) => [r.variantKey, r._count._all]));

    return NextResponse.json({
      templates: templates.map((t) => ({
        ...t,
        _count: { reels: countMap.get(t.variantKey) ?? 0 },
      })),
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load templates' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdminRole((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: any = await req.json().catch(() => ({}));
    const id = String(body?.id || '');
    const status = String(body?.status || '');
    const hasDefaultTrack = Object.prototype.hasOwnProperty.call(body, 'defaultMusicTrackId');

    if (!id) {
      return NextResponse.json({ error: 'Invalid id' }, { status: 400 });
    }
    if (status && !['draft', 'active'].includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }
    if (hasDefaultTrack && body.defaultMusicTrackId !== null && typeof body.defaultMusicTrackId !== 'string') {
      return NextResponse.json({ error: 'Invalid defaultMusicTrackId' }, { status: 400 });
    }

    const data: any = {};
    if (status) data.status = status;
    if (hasDefaultTrack) data.defaultMusicTrackId = body.defaultMusicTrackId || null;

    const updated = await prisma.videoTemplate.update({
      where: { id },
      data,
      include: {
        defaultMusicTrack: { select: { id: true, name: true, fileUrl: true, duration: true } },
      },
    });
    return NextResponse.json({ template: updated });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to update template' }, { status: 500 });
  }
}
