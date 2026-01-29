import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { upsertContact, addTags } from '@/lib/ghl';
import { formatPhoneNumber } from '@/lib/utils';

export const dynamic = 'force-dynamic';

function dimsForVariant(variant: string): { width: number; height: number } {
  if (variant.startsWith('H')) return { width: 1920, height: 1080 };
  return { width: 1080, height: 1920 };
}

function getWebhookUrlFromHeaders(headers: Headers): string | undefined {
  const host = headers.get('x-forwarded-host') || headers.get('host') || '';
  const proto = headers.get('x-forwarded-proto') || 'https';
  if (!host) return undefined;
  return `${proto}://${host}/api/integrations/json2video/webhook`;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { id, firstName, lastName, email, phone, propertyAddress, propertyCity, propertyPostalCode, bedrooms, bathrooms, sizeSqFt, headshotUrl, agencyLogoUrl, images } = body;

    if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
    if (!firstName || !lastName || !email) return NextResponse.json({ error: 'Missing contact info' }, { status: 400 });
    if (!propertyAddress) return NextResponse.json({ error: 'Missing property address' }, { status: 400 });
    if (!Array.isArray(images) || images.length !== 6) return NextResponse.json({ error: 'Exactly 6 images required' }, { status: 400 });

    const lead = await prisma.freeSlideshowLead.findUnique({ where: { id }, select: { id: true, status: true } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });
    if (lead.status !== 'DRAFT') return NextResponse.json({ error: 'Already submitted' }, { status: 400 });

    // Update lead with form data
    await prisma.freeSlideshowLead.update({
      where: { id },
      data: {
        firstName,
        lastName,
        email,
        phone: phone || null,
        propertyAddress,
        propertyCity: propertyCity || null,
        propertyPostalCode: propertyPostalCode || null,
        bedrooms: bedrooms != null ? String(bedrooms) : null,
        bathrooms: bathrooms != null ? String(bathrooms) : null,
        sizeSqFt: sizeSqFt != null ? String(sizeSqFt) : null,
        headshotUrl: headshotUrl || null,
        agencyLogoUrl: agencyLogoUrl || null,
        status: 'GENERATING',
      },
    });

    // Create image records
    await prisma.freeSlideshowSourceImage.deleteMany({ where: { leadId: id } });
    await prisma.freeSlideshowSourceImage.createMany({
      data: images.map((url: string, i: number) => ({ leadId: id, url, sortOrder: i })),
    });

    // Prepare H1 template variant
    const tplH1 = (process.env.JSON2VIDEO_TEMPLATE_ID_H1 || '').trim();
    if (!tplH1) return NextResponse.json({ error: 'No JSON2Video H1 template configured' }, { status: 400 });

    const VARIANTS = [{ key: 'h1-16x9', templateId: tplH1 }];

    const provider = new J2VProvider();
    const webhookUrl = getWebhookUrlFromHeaders(req.headers);

    // Build merge variables
    const merge = [
      { find: 'ADDRESS', replace: propertyAddress || '' },
      { find: 'CITY', replace: propertyCity || '' },
      { find: 'POSTCODE', replace: propertyPostalCode || '' },
      { find: 'BEDROOMS', replace: String(bedrooms || '') },
      { find: 'BATHROOMS', replace: String(bathrooms || '') },
      { find: 'SQFT', replace: String(sizeSqFt || '') },
      ...images.slice(0, 6).map((url: string, i: number) => ({ find: `IMAGE_${i + 1}`, replace: url })),
      { find: 'AGENT_PICTURE', replace: headshotUrl || '' },
      { find: 'AGENT_NAME', replace: `${firstName || ''} ${lastName || ''}`.trim() },
      { find: 'AGENT_PHONE', replace: formatPhoneNumber(phone) },
      { find: 'AGENCY_LOGO', replace: agencyLogoUrl || '' },
    ];

    // Create slideshow records and render
    for (const v of VARIANTS) {
      const { width, height } = dimsForVariant(v.key);
      const slideshow = await prisma.freeSlideshow.create({
        data: {
          leadId: id,
          variantKey: v.key,
          provider: 'j2v',
          renderId: 'pending',
          status: 'QUEUED',
          width,
          height,
        },
      });

      try {
        const { renderId } = await provider.render({
          images,
          variantKey: v.key as any,
          webhookUrl: webhookUrl || '',
          meta: { leadId: id, slideshowId: slideshow.id },
          templateId: v.templateId,
          merge,
        });
        await prisma.freeSlideshow.update({ where: { id: slideshow.id }, data: { renderId, status: 'RENDERING' } });
      } catch (err: any) {
        await prisma.freeSlideshow.update({ where: { id: slideshow.id }, data: { status: 'FAILED', error: String(err?.message || err) } });
      }
    }

    // GHL integration
    try {
      const locationId = process.env.GHL_LOCATION_ID;
      if (locationId) {
        const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
        const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
        const pageUrl = `${baseUrl.replace(/\/$/, '')}/free-slideshow/${id}`;
        const contactId = await upsertContact({
          firstName,
          lastName,
          email,
          phone,
          locationId,
          customFields: [{ key: 'free_slideshow_page_url', field_value: pageUrl }],
        });
        if (contactId) {
          await prisma.freeSlideshowLead.update({ where: { id }, data: { ghlContactId: contactId } });
          await addTags(contactId, ['realtor', 'used free slideshow tool']);
        }
      }
    } catch (e) {
      console.warn('[FreeSlideshow] GHL integration failed; continuing', e);
    }

    return NextResponse.json({ success: true, id });
  } catch (e) {
    console.error('free-slideshow/submit failed', e);
    return NextResponse.json({ error: 'Failed to submit' }, { status: 500 });
  }
}

