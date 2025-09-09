import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';

export async function PUT(req: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as any)?.id as string | undefined;
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));
    const { name, avatarUrl } = body as { name?: string; avatarUrl?: string | null };

    const data: any = {};
    if (typeof name === 'string') data.name = name.trim();
    if (avatarUrl !== undefined) data.avatarUrl = avatarUrl || null;

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: 'No changes provided' }, { status: 400 });
    }

    const updated = await prisma.user.update({ where: { id: userId }, data });

    return NextResponse.json({
      id: updated.id,
      name: updated.name,
      email: updated.email,
      role: updated.role,
      avatarUrl: (updated as any).avatarUrl ?? null,
    });
  } catch (err) {
    console.error('update-profile error', err);
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 });
  }
}

