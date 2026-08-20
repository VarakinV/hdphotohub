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
    const tracks = await prisma.videoMusicTrack.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { reels: true } } },
    });
    return NextResponse.json({ tracks });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to load music tracks' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdminRole((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: any = await req.json().catch(() => ({}));
    const name = String(body?.name || '').trim();
    const fileUrl = String(body?.fileUrl || '').trim();
    const duration = Number(body?.duration || 0);
    const genre = body?.genre ? String(body.genre) : null;
    const mood = body?.mood ? String(body.mood) : null;

    if (!name || !fileUrl) {
      return NextResponse.json({ error: 'name and fileUrl are required' }, { status: 400 });
    }
    if (!/^https?:\/\//.test(fileUrl)) {
      return NextResponse.json({ error: 'fileUrl must be an http(s) URL' }, { status: 400 });
    }

    const track = await prisma.videoMusicTrack.create({
      data: { name, fileUrl, duration, genre, mood },
    });
    return NextResponse.json({ track });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to create music track' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdminRole((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body: any = await req.json().catch(() => ({}));
    const id = String(body?.id || '').trim();
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const name = body?.name !== undefined ? String(body.name).trim() : undefined;
    const fileUrl = body?.fileUrl !== undefined ? String(body.fileUrl).trim() : undefined;
    const duration = body?.duration !== undefined ? Number(body.duration || 0) : undefined;
    const genre = body?.genre !== undefined ? (body.genre ? String(body.genre) : null) : undefined;
    const mood = body?.mood !== undefined ? (body.mood ? String(body.mood) : null) : undefined;

    if (name === '') {
      return NextResponse.json({ error: 'name cannot be empty' }, { status: 400 });
    }
    if (fileUrl === '') {
      return NextResponse.json({ error: 'fileUrl cannot be empty' }, { status: 400 });
    }
    if (fileUrl !== undefined && !/^https?:\/\//.test(fileUrl)) {
      return NextResponse.json({ error: 'fileUrl must be an http(s) URL' }, { status: 400 });
    }

    const track = await prisma.videoMusicTrack.update({
      where: { id },
      data: { name, fileUrl, duration, genre, mood },
    });
    return NextResponse.json({ track });
  } catch (e: any) {
    console.error(e);
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to update music track' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || !isAdminRole((session.user as any)?.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const track = await prisma.videoMusicTrack.update({
      where: { id },
      data: { isActive: false },
    });
    return NextResponse.json({ track });
  } catch (e: any) {
    console.error(e);
    if (e?.code === 'P2025') {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }
    return NextResponse.json({ error: 'Failed to delete music track' }, { status: 500 });
  }
}
