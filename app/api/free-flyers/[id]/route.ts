import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;
    const lead = await prisma.freeFlyersLead.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, flyers: true },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    return NextResponse.json({ lead });
  } catch (e) {
    console.error('free-flyers GET failed', e);
    return NextResponse.json({ error: 'Failed' }, { status: 500 });
  }
}

