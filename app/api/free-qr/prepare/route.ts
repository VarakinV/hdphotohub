import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const lead = await prisma.freeQrLead.create({
      data: {
        firstName: '',
        lastName: '',
        email: '',
        phone: null,
        destinationUrl: 'https://example.com',
        status: 'DRAFT',
      },
      select: { id: true, status: true },
    });
    return NextResponse.json({ id: lead.id, status: lead.status });
  } catch (e) {
    console.error('free-qr/prepare failed', e);
    return NextResponse.json({ error: 'Failed to prepare lead' }, { status: 500 });
  }
}

