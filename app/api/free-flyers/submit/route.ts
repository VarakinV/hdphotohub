import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';




export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      leadId,
      firstName,
      lastName,
      email,
      phone,
      propertyAddress,
      propertyCity,
      propertyPostalCode,
      bedrooms,
      bathrooms,
      sizeSqFt,
      propertySiteUrl,
      images,
      headshotUrl,
      agencyLogoUrl,
      recaptchaToken,
    } = body || {};

    // reCAPTCHA (v3) optional check via shared helper
    const recaptcha = await verifyRecaptchaServer(recaptchaToken, 'free_flyers_submit');
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 });
    }

    // Validate
    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    if (!firstName || !lastName || !email || !phone) return NextResponse.json({ error: 'All contact fields are required' }, { status: 400 });
    if (!propertyAddress || !propertyCity || !propertyPostalCode) return NextResponse.json({ error: 'Property fields are required' }, { status: 400 });
    if (!sizeSqFt) return NextResponse.json({ error: 'Property Sq Ft is required' }, { status: 400 });
    if (!propertySiteUrl) return NextResponse.json({ error: 'Property Site is required' }, { status: 400 });
    if (!headshotUrl || !agencyLogoUrl) return NextResponse.json({ error: 'Headshot and Agency Logo are required' }, { status: 400 });
    if (!Array.isArray(images) || images.length !== 6) return NextResponse.json({ error: 'Please upload exactly 6 images' }, { status: 400 });

    const lead = await prisma.freeFlyersLead.findUnique({ where: { id: leadId }, select: { id: true } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Update lead & replace images
    await prisma.$transaction([
      prisma.freeFlyersLead.update({
        where: { id: leadId },
        data: {
          firstName, lastName, email, phone,
          propertyAddress, propertyCity, propertyPostalCode,
          bedrooms: bedrooms ? String(bedrooms) : null,
          bathrooms: bathrooms ? String(bathrooms) : null,
          sizeSqFt: String(sizeSqFt),
          propertySiteUrl,
          headshotUrl: headshotUrl || null,
          agencyLogoUrl: agencyLogoUrl || null,
          status: 'GENERATING',
        },
      }),
      prisma.freeFlyersSourceImage.deleteMany({ where: { leadId } }),
      prisma.freeFlyersSourceImage.createMany({ data: images.map((url: string, i: number) => ({ leadId, url, sortOrder: i })) }),
    ]);

    // Seed placeholder flyer rows idempotently; create only missing variants.
    // Do not delete existing in-progress or completed rows.
    const variants: Array<'f1' | 'f2' | 'f3'> = ['f1', 'f2', 'f3'];

    const existing = await prisma.freeFlyer.findMany({
      where: {
        leadId,
        variantKey: { in: variants },
        status: { in: ['QUEUED', 'RENDERING', 'COMPLETE'] as any },
      },
      select: { variantKey: true },
    });
    const existingKeys = new Set(existing.map((r) => r.variantKey));
    const toCreate = variants.filter((v) => !existingKeys.has(v));

    if (toCreate.length > 0) {
      await prisma.freeFlyer.createMany({
        data: toCreate.map((v) => ({ leadId, variantKey: v, status: 'QUEUED' })),
      });
    }

    return NextResponse.json({ ok: true, id: leadId });
  } catch (e) {
    console.error('free-flyers/submit failed', e);
    return NextResponse.json({ error: 'Failed to submit free flyers' }, { status: 500 });
  }
}

