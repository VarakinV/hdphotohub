import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    const user: any = session?.user;
    if (!user?.id || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { realtorId, adminId } = await req.json();
    if (!realtorId || !adminId) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    // Validate entities exist and roles
    const [realtor, admin] = await Promise.all([
      prisma.realtor.findUnique({ where: { id: realtorId }, select: { id: true } }),
      prisma.user.findUnique({ where: { id: adminId }, select: { id: true, role: true } }),
    ]);
    if (!realtor) return NextResponse.json({ error: 'Realtor not found' }, { status: 404 });
    if (!admin || (admin.role !== 'ADMIN' && admin.role !== 'SUPERADMIN')) {
      return NextResponse.json({ error: 'Admin not found' }, { status: 400 });
    }

    await prisma.realtorAssignment.upsert({
      where: { adminId_realtorId: { adminId, realtorId } },
      create: { adminId, realtorId },
      update: {},
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create assignment' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    const user: any = session?.user;
    if (!user?.id || user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { realtorId, adminId } = await req.json();
    if (!realtorId || !adminId) {
      return NextResponse.json({ error: 'Invalid body' }, { status: 400 });
    }

    await prisma.realtorAssignment.deleteMany({ where: { realtorId, adminId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete assignment' }, { status: 500 });
  }
}

