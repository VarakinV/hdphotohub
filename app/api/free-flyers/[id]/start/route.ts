import { NextRequest, NextResponse, after } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { renderFlyer } from '@/lib/flyers/generator';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { upsertContact, addTags } from '@/lib/ghl';

function getBaseUrlFromHeaders(hdrs: Headers): string {
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const base = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  return (base || '').replace(/\/$/, '');
}

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';


export const maxDuration = 60; // Increase if your Vercel plan allows (e.g., 300)

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params;

    const lead = await prisma.freeFlyersLead.findUnique({
      where: { id },
      include: { images: { orderBy: { sortOrder: 'asc' } }, flyers: true },
    });
    if (!lead) return NextResponse.json({ error: 'Not found' }, { status: 404 });

    const url = new URL(req.url);
    const variantParam = (url.searchParams.get('variant') || '').toLowerCase();
    const allowed: Array<'f1' | 'f2' | 'f3'> = ['f1', 'f2', 'f3'];
    const variant = allowed.includes(variantParam as any)
      ? (variantParam as 'f1' | 'f2' | 'f3')
      : null;

    // Ensure placeholder rows exist
    const VARIANTS: Array<'f1' | 'f2' | 'f3'> = ['f1', 'f2', 'f3'];
    const existingKeys = new Set((lead.flyers || []).map((f) => (f.variantKey || '').toLowerCase())) as Set<'f1'|'f2'|'f3'>;
    const toCreate = VARIANTS.filter((k) => !existingKeys.has(k));
    if (toCreate.length) {
      await prisma.freeFlyer.createMany({ data: toCreate.map((k) => ({ leadId: id, variantKey: k, status: 'QUEUED' })) });
    }

    // If no variant specified, just ensure status is GENERATING and return quickly
    if (!variant) {
      if (lead.status !== 'GENERATING') {
        await prisma.freeFlyersLead.update({ where: { id }, data: { status: 'GENERATING' } });
      }
      return NextResponse.json({ ok: true, id });
    }

    if (!isS3Available()) return NextResponse.json({ error: 'S3 not configured' }, { status: 503 });

    // Get common data for rendering
    const images = (lead.images || []).sort((a, b) => a.sortOrder - b.sortOrder).map((x) => x.url).slice(0, 6);
    const displayAddress = [lead.propertyAddress, lead.propertyCity, lead.propertyPostalCode].filter(Boolean).join(', ');
    const realtor = {
      name: `${lead.firstName || ''} ${lead.lastName || ''}`.trim(),
      phone: lead.phone || '',
      email: lead.email || '',
      headshot: lead.headshotUrl || undefined,
      logo: lead.agencyLogoUrl || undefined,
    };

    // Mark lead as generating
    if (lead.status !== 'GENERATING') {
      await prisma.freeFlyersLead.update({ where: { id }, data: { status: 'GENERATING' } });
    }

    // Strict serialization: if another variant is rendering, don't start a new one
    const active = await prisma.freeFlyer.findFirst({ where: { leadId: id, status: 'RENDERING' } });
    if (active && active.variantKey !== variant) {
      return NextResponse.json({ ok: true, queued: true, reason: 'another variant rendering' });
    }

    // If this variant already complete or rendering, return quickly
    const current = await prisma.freeFlyer.findFirst({ where: { leadId: id, variantKey: variant } });
    if (current?.status === 'COMPLETE') {
      return NextResponse.json({ ok: true, id, variant, alreadyComplete: true });
    }
    if (current?.status === 'RENDERING') {
      return NextResponse.json({ ok: true, id, variant, alreadyRendering: true });
    }

    // Reserve this slot by marking as RENDERING before returning
    await prisma.freeFlyer.updateMany({
      where: { leadId: id, variantKey: variant, status: { in: ['QUEUED', 'FAILED'] } },
      data: { status: 'RENDERING', error: null },
    });

    const basePath = `free-flyers/${id}`;
    after(async () => {
      try {
        const { pdf, previewJpeg, widthPx, heightPx } = await renderFlyer({
          address: displayAddress,
          realtor,
          images,
          beds: lead.bedrooms != null ? String(lead.bedrooms) : null,
          baths: lead.bathrooms != null ? lead.bathrooms.toString() : null,
          sizeSqFt: lead.sizeSqFt ? String(lead.sizeSqFt) : null,
          qrUrl: lead.propertySiteUrl || '',
          variant,
        });
        const pdfName = `flyer-${variant}.pdf`;
        const { fileUrl: pdfUrl } = await uploadBufferToS3WithPath(basePath, pdfName, pdf, 'application/pdf');
        const jpgName = `previews/flyer-${variant}.jpg`;
        const { fileUrl: previewUrl } = await uploadBufferToS3WithPath(basePath, jpgName, previewJpeg, 'image/jpeg');
        await prisma.freeFlyer.updateMany({
          where: { leadId: id, variantKey: variant },
          data: { status: 'COMPLETE', url: pdfUrl, previewUrl, pageWidth: widthPx, pageHeight: heightPx },
        });

        // If all variants complete, mark lead complete
        const refreshed = await prisma.freeFlyersLead.findUnique({ where: { id }, include: { flyers: true } });
        const allDone = (refreshed?.flyers || []).length >= 3 && (refreshed?.flyers || []).every((f) => f.status === 'COMPLETE');
        if (allDone) {
          await prisma.freeFlyersLead.update({ where: { id }, data: { status: 'COMPLETE' } });
        }

        // GHL integration (best-effort, once)
        try {
          const locationId = process.env.GHL_LOCATION_ID;
          if (locationId && !lead.ghlContactId) {
            const pageUrl = `${getBaseUrlFromHeaders(req.headers)}/free-flyers/${id}`;
            const contactId = await upsertContact({
              firstName: lead.firstName || '',
              lastName: lead.lastName || '',
              email: lead.email || '',
              phone: lead.phone || '',
              locationId,
              customFields: [{ key: 'free_flyers_page_url', field_value: pageUrl }],
            });
            if (contactId) {
              await prisma.freeFlyersLead.update({ where: { id }, data: { ghlContactId: contactId } });
              await addTags(contactId, ['realtor', 'used free flyers tool']);
            }
          }
        } catch (e) {
          console.warn('[FreeFlyers] GHL integration failed; continuing', e);
        }
      } catch (err: any) {
        await prisma.freeFlyer.updateMany({ where: { leadId: id, variantKey: variant }, data: { status: 'FAILED', error: String(err?.message || err) } });
      }
    });

    return NextResponse.json({ ok: true, id, variant });
  } catch (e) {
    console.error('free-flyers start failed', e);
    return NextResponse.json({ error: 'Failed to start generation' }, { status: 500 });
  }
}

