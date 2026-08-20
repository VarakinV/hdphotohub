import { NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const tracks = await prisma.videoMusicTrack.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      select: { id: true, name: true, fileUrl: true, duration: true, genre: true, mood: true },
    });
    return NextResponse.json({ tracks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load music tracks' }, { status: 500 });
  }
}
