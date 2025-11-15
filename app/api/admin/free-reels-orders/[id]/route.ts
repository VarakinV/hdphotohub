import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { deleteFromS3 } from '@/lib/utils/s3';

export const dynamic = 'force-dynamic';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === 'ADMIN' || me.role === 'SUPERADMIN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;

    // Load lead with associated assets to clean up S3
    const lead = await prisma.freeReelsLead.findUnique({
      where: { id },
      include: { images: true, reels: true },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const urls: (string | null | undefined)[] = [lead.headshotUrl, lead.agencyLogoUrl];
    for (const img of lead.images) urls.push(img.url);
    for (const reel of lead.reels) {
      urls.push(reel.url, reel.thumbnail);
    }

    await Promise.all(
      urls.filter(Boolean).map((u) => deleteFromS3(u as string).catch(() => {}))
    );

    // Delete child rows first, then the lead
    await prisma.$transaction([
      prisma.freeReel.deleteMany({ where: { leadId: id } }),
      prisma.freeReelsSourceImage.deleteMany({ where: { leadId: id } }),
      prisma.freeReelsLead.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete free reels lead', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

