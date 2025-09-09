import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { hashPassword, verifyPassword, validatePassword } from '@/lib/utils/password';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { currentPassword, newPassword } = await req.json();
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    }

    const strength = validatePassword(newPassword);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.errors.join('. ') }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.password) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const ok = await verifyPassword(currentPassword, user.password);
    if (!ok) {
      return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });
    }

    const hashed = await hashPassword(newPassword);
    await prisma.user.update({ where: { id: userId }, data: { password: hashed } });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('update-password error', err);
    return NextResponse.json({ error: 'Failed to update password' }, { status: 500 });
  }
}

