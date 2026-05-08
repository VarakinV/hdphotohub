import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

const DEFAULT_TOWNS = ['Chestermere', 'Airdrie', 'Okotoks', 'High River', 'Cochrane', 'Langdon'];

async function requireAdminId() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return session.user.id;
}

async function ensureDefaults(adminId: string) {
  const settings = await prisma.adminBookingSettings.upsert({
    where: { adminId },
    update: {},
    create: {
      adminId,
      timeZone: 'UTC',
      leadTimeMin: 0,
      maxAdvanceDays: 60,
      defaultBufferMin: 0,
      travelFreeRadiusKm: 35,
      travelPerKmRateCents: 85,
    },
  });
  const count = await prisma.adminTravelFlatFeeTown.count({ where: { adminId } });
  if (count === 0) {
    await prisma.adminTravelFlatFeeTown.createMany({
      data: DEFAULT_TOWNS.map((cityName) => ({ adminId, cityName, feeCents: 3000 })),
      skipDuplicates: true,
    });
  }
  return settings;
}

export async function GET() {
  try {
    const adminId = await requireAdminId();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const settings = await ensureDefaults(adminId);
    const towns = await prisma.adminTravelFlatFeeTown.findMany({
      where: { adminId },
      orderBy: { cityName: 'asc' },
    });
    return NextResponse.json({ settings, towns });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load travel fees' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const adminId = await requireAdminId();
    if (!adminId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const travelFreeRadiusKm = Math.max(0, Number(body.travelFreeRadiusKm ?? 35));
    const travelPerKmRateCents = Math.max(0, Math.round(Number(body.travelPerKmRateDollars ?? 0.85) * 100));
    const saved = await prisma.adminBookingSettings.upsert({
      where: { adminId },
      update: { travelFreeRadiusKm, travelPerKmRateCents },
      create: {
        adminId,
        timeZone: 'UTC',
        leadTimeMin: 0,
        maxAdvanceDays: 60,
        defaultBufferMin: 0,
        travelFreeRadiusKm,
        travelPerKmRateCents,
      },
    });
    return NextResponse.json(saved);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save travel fee settings' }, { status: 500 });
  }
}
