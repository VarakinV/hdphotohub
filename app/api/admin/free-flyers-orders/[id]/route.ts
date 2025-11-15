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

    const lead = await prisma.freeFlyersLead.findUnique({
      where: { id },
      include: { images: true, flyers: true },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const urls: (string | null | undefined)[] = [lead.headshotUrl, lead.agencyLogoUrl];
    for (const img of lead.images) urls.push(img.url);
    for (const f of lead.flyers) urls.push(f.url, f.previewUrl);

    await Promise.all(
      urls.filter(Boolean).map((u) => deleteFromS3(u as string).catch(() => {}))
    );

    await prisma.$transaction([
      prisma.freeFlyer.deleteMany({ where: { leadId: id } }),
      prisma.freeFlyersSourceImage.deleteMany({ where: { leadId: id } }),
      prisma.freeFlyersLead.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete free flyers lead', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

