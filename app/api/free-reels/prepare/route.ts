import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';

export const dynamic = 'force-dynamic';

export async function POST(_req: NextRequest) {
  try {
    const lead = await prisma.freeReelsLead.create({
      data: {
        firstName: '',
        lastName: '',
        email: '',
        phone: null,
        // propertyAddress is required (not null); initialize empty and update on submit
        propertyAddress: '',
        propertyCity: null,
        propertyPostalCode: null,
        bedrooms: null,
        bathrooms: null,
        headshotUrl: null,
        agencyLogoUrl: null,
        status: 'DRAFT',
      },
      select: { id: true, status: true },
    });
    return NextResponse.json({ id: lead.id, status: lead.status });
  } catch (e) {
    console.error('free-reels/prepare failed', e);
    return NextResponse.json({ error: 'Failed to prepare lead' }, { status: 500 });
  }
}

