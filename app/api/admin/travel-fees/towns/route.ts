import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const cityName = String(body.cityName || '').trim();
    const feeCents = Math.max(0, Math.round(Number(body.feeDollars ?? 0) * 100));
    if (!cityName) return NextResponse.json({ error: 'City/town name is required' }, { status: 400 });
    const town = await prisma.adminTravelFlatFeeTown.create({
      data: { adminId: session.user.id, cityName, feeCents, active: body.active !== false },
    });
    return NextResponse.json(town);
  } catch (e: any) {
    if (e?.code === 'P2002') {
      return NextResponse.json({ error: 'This town already exists' }, { status: 409 });
    }
    console.error(e);
    return NextResponse.json({ error: 'Failed to create town' }, { status: 500 });
  }
}
