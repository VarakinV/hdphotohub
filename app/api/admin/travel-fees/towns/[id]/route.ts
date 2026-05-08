import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

async function getSessionAdminId() {
  const session = await auth();
  return session?.user?.id || null;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await getSessionAdminId();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data: any = {};
    if (body.cityName != null) data.cityName = String(body.cityName).trim();
    if (body.feeDollars != null) data.feeCents = Math.max(0, Math.round(Number(body.feeDollars) * 100));
    if (typeof body.active === 'boolean') data.active = body.active;
    const existing = await prisma.adminTravelFlatFeeTown.findFirst({ where: { id, adminId } });
    if (!existing) return NextResponse.json({ error: 'Town not found' }, { status: 404 });
    const town = await prisma.adminTravelFlatFeeTown.update({ where: { id }, data });
    return NextResponse.json(town);
  } catch (e: any) {
    if (e?.code === 'P2002') return NextResponse.json({ error: 'This town already exists' }, { status: 409 });
    console.error(e);
    return NextResponse.json({ error: 'Failed to update town' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const adminId = await getSessionAdminId();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { id } = await params;
    await prisma.adminTravelFlatFeeTown.deleteMany({ where: { id, adminId } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete town' }, { status: 500 });
  }
}
