import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { upsertContact, addTags } from '@/lib/ghl';
import { randomUUID } from 'crypto';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';
import { formatPhoneNumber } from '@/lib/utils';


function dimsForVariant(variant: string): { width: number; height: number } {
  switch (variant) {
    case 'v1-9x16':
    case 'v2-9x16':
    case 'v3-9x16':
    case 'v4-9x16':
    case 'v5-9x16':
    case 'v6-9x16':
    case 'v7-9x16':
    case 'v8-9x16':
    case 'v9-9x16':
      return { width: 1080, height: 1920 };
    default:
      return { width: 1920, height: 1080 };
  }
}

function getWebhookUrlFromHeaders(hdrs: Headers): string | undefined {
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const explicitWebhook = process.env.JSON2VIDEO_WEBHOOK_URL?.trim();
  const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  const token = process.env.JSON2VIDEO_WEBHOOK_TOKEN;
  let webhookUrl: string | undefined;
  if (explicitWebhook) {
    const hasPath = /\/api\/integrations\/json2video\/webhook(\?|$)/i.test(explicitWebhook);
    webhookUrl = hasPath ? explicitWebhook : `${explicitWebhook.replace(/\/$/, '')}/api/integrations/json2video/webhook`;
    if (token) webhookUrl += (webhookUrl.includes('?') ? '&' : '?') + `token=${token}`;
  } else {
    const base = (fallbackBase || '').replace(/\/$/, '');
    webhookUrl = base ? `${base}/api/integrations/json2video/webhook${token ? `?token=${token}` : ''}` : undefined;
  }
  return webhookUrl;
}



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
      images,
      headshotUrl,
      agencyLogoUrl,
      recaptchaToken,
    } = body || {};

    // reCAPTCHA (v3) verification via shared helper
    const recaptcha = await verifyRecaptchaServer(recaptchaToken, 'free_reels_submit');
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 });
    }

    if (!leadId) return NextResponse.json({ error: 'leadId is required' }, { status: 400 });
    if (!firstName || !lastName || !email) return NextResponse.json({ error: 'Contact info is required' }, { status: 400 });
    if (!propertyAddress) return NextResponse.json({ error: 'Property address is required' }, { status: 400 });
    if (!Array.isArray(images) || images.length < 3 || images.length > 6) {
      return NextResponse.json({ error: 'Please provide 3 to 6 property images' }, { status: 400 });
    }

    const lead = await prisma.freeReelsLead.findUnique({ where: { id: leadId }, select: { id: true } });
    if (!lead) return NextResponse.json({ error: 'Lead not found' }, { status: 404 });

    // Update lead & replace source images
    await prisma.$transaction([
      prisma.freeReelsLead.update({
        where: { id: leadId },
        data: {
          firstName,
          lastName,
          email,
          phone: phone || null,
          propertyAddress,
          propertyCity: propertyCity || null,
          propertyPostalCode: propertyPostalCode || null,
          bedrooms: bedrooms ? String(bedrooms) : null,
          bathrooms: bathrooms ? String(bathrooms) : null,
          headshotUrl: headshotUrl || null,
          agencyLogoUrl: agencyLogoUrl || null,
          status: 'GENERATING',
        },
      }),
      prisma.freeReelsSourceImage.deleteMany({ where: { leadId } }),
      prisma.freeReelsSourceImage.createMany({
        data: images.map((url: string, i: number) => ({ leadId, url, sortOrder: i })),
      }),
    ]);

    // Prepare variants (V1, V3, V4)
    const tplV1 = (process.env.JSON2VIDEO_TEMPLATE_ID_V1 || '').trim();
    const tplV3 = (process.env.JSON2VIDEO_TEMPLATE_ID_V3 || '').trim();
    const tplV4 = (process.env.JSON2VIDEO_TEMPLATE_ID_V4 || '').trim();
    const VARIANTS = [
      ...(tplV1 ? [{ key: 'v1-9x16', templateId: tplV1 }] : []),
      ...(tplV3 ? [{ key: 'v3-9x16', templateId: tplV3 }] : []),
      ...(tplV4 ? [{ key: 'v4-9x16', templateId: tplV4 }] : []),
    ] as Array<{ key: string; templateId: string }>;

    if (VARIANTS.length === 0) return NextResponse.json({ error: 'No JSON2Video templates configured (V1/V3/V4)' }, { status: 400 });

    const provider = new J2VProvider();
    const webhookUrl = getWebhookUrlFromHeaders(req.headers);

    // Build merge variables
    const merge = [
      { find: 'ADDRESS', replace: propertyAddress || '' },
      { find: 'CITY', replace: propertyCity || '' },
      { find: 'POSTCODE', replace: propertyPostalCode || '' },
      { find: 'BEDROOMS', replace: String(bedrooms || '') },
      { find: 'BATHROOMS', replace: String(bathrooms || '') },
      ...images.slice(0, 6).map((url: string, i: number) => ({ find: `IMAGE_${i + 1}`, replace: url })),
      { find: 'AGENT_PICTURE', replace: headshotUrl || '' },
      { find: 'AGENT_NAME', replace: `${firstName} ${lastName}`.trim() },
      { find: 'AGENT_PHONE', replace: formatPhoneNumber(phone) },
      { find: 'AGENCY_LOGO', replace: agencyLogoUrl || '' },
    ];

    // Idempotency: only render variants that aren't already in progress or complete
    const desiredKeys = VARIANTS.map((v) => v.key);
    const existing = await prisma.freeReel.findMany({
      where: { leadId, variantKey: { in: desiredKeys } },
      select: { variantKey: true, status: true },
    });
    const activeKeys = new Set(
      existing
        .filter((r: any) => ['QUEUED', 'RENDERING', 'COMPLETE'].includes(String(r.status)))
        .map((r) => r.variantKey)
    );
    const toCreate = VARIANTS.filter((v) => !activeKeys.has(v.key));

    if (toCreate.length === 0) {
      return NextResponse.json({ ok: true, id: leadId });
    }

    // Render each missing variant, then create DB rows with actual renderIds
    await Promise.all(
      toCreate.map(async (v) => {
        try {
          const { renderId } = await provider.render({
            images,
            variantKey: v.key as any,
            webhookUrl: webhookUrl || '',
            meta: { leadId },
            templateId: v.templateId,
            merge,
          } as any);
          const { width, height } = dimsForVariant(v.key);
          await prisma.freeReel.create({
            data: {
              leadId,
              variantKey: v.key,
              provider: 'j2v',
              renderId,
              status: 'RENDERING',
              width,
              height,
            },
          });
        } catch (err: any) {
          // Create a FAILED row with a unique placeholder renderId
          await prisma.freeReel.create({
            data: {
              leadId,
              variantKey: v.key,
              provider: 'j2v',
              renderId: `failed-${randomUUID()}`,
              status: 'FAILED',
              error: String(err?.message || err),
            },
          });
        }
      })
    );


    // GHL integration
    try {
      const locationId = process.env.GHL_LOCATION_ID;
      if (locationId) {
        const host = req.headers.get('x-forwarded-host') ?? req.headers.get('host');
        const proto = req.headers.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
        const baseUrl = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
        const pageUrl = `${baseUrl.replace(/\/$/, '')}/free-reels/${leadId}`;
        const contactId = await upsertContact({
          firstName,
          lastName,
          email,
          phone,
          locationId,
          customFields: [{ key: 'free_reels_page_url', field_value: pageUrl }],
        });
        if (contactId) {
          await prisma.freeReelsLead.update({ where: { id: leadId }, data: { ghlContactId: contactId } });
          await addTags(contactId, ['realtor', 'used free reels tool']);
        }
      }
    } catch (e) {
      console.warn('[FreeReels] GHL integration failed; continuing', e);
    }

    return NextResponse.json({ ok: true, id: leadId });
  } catch (e) {
    console.error('free-reels/submit failed', e);
    return NextResponse.json({ error: 'Failed to submit free reels' }, { status: 500 });
  }
}

