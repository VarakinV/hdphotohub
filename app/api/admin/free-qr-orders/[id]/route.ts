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

    const lead = await prisma.freeQrLead.findUnique({
      where: { id },
      include: { qrCodes: true },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const urls: (string | null | undefined)[] = [];
    for (const q of lead.qrCodes) urls.push(q.svgUrl, q.pngUrl, q.pdfUrl);

    await Promise.all(
      urls.filter(Boolean).map((u) => deleteFromS3(u as string).catch(() => {}))
    );

    await prisma.$transaction([
      prisma.freeQr.deleteMany({ where: { leadId: id } }),
      prisma.freeQrLead.delete({ where: { id } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Failed to delete free QR lead', e);
    return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
  }
}

