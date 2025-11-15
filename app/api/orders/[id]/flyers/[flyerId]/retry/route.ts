import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { renderFlyer } from '@/lib/flyers/generator';

function getBaseUrlFromHeaders(req: NextRequest): string {
  const hdrs = req.headers;
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  return (fallbackBase || '').replace(/\/$/, '');
}

function qrTargetForVariant(orderId: string, variant: 'f1' | 'f2' | 'f3', base: string): string {
  const tpl = variant === 'f1' ? 'v1' : variant === 'f2' ? 'v2' : 'v3';
  return `${base}/property/${orderId}/${tpl}`;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; flyerId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isS3Available()) return NextResponse.json({ error: 'S3 not configured' }, { status: 503 });

    const { id, flyerId } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const flyer = await prisma.orderFlyer.findUnique({ where: { id: flyerId } });
    if (!flyer || flyer.orderId !== id) return NextResponse.json({ error: 'Flyer not found' }, { status: 404 });

    // Permission: admin/superadmin or owning realtor
    const order = await prisma.order.findUnique({
      where: { id },
      include: { realtor: { select: { firstName: true, lastName: true, phone: true, email: true, headshot: true, companyLogo: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Validate sources
    const sources = await prisma.orderReelSourceImage.findMany({ where: { orderId: id }, orderBy: { sortOrder: 'asc' } });
    if (sources.length < 3) return NextResponse.json({ error: 'At least 3 images required' }, { status: 400 });

    const r = order.realtor as any;

    // Build display address
    const street = order.propertyAddressOverride || order.propertyAddress || '';
    const city = order.propertyCityOverride || order.propertyCity || '';
    const postal = order.propertyPostalCodeOverride || order.propertyPostalCode || '';
    const province = order.propertyProvince || '';
    const formatted = order.propertyFormattedAddress;
    const hasOverrides = !!(order.propertyAddressOverride || order.propertyCityOverride || order.propertyPostalCodeOverride);
    const address = hasOverrides
      ? [street, [city, province].filter(Boolean).join(' '), postal].filter(Boolean).join(', ').replace(/,\s*,/g, ', ').trim()
      : (formatted || [street, [city, province].filter(Boolean).join(' '), postal].filter(Boolean).join(', ').replace(/,\s*,/g, ', ').trim());

    const images = sources.map((s) => s.url);

    try {
      await prisma.orderFlyer.update({ where: { id: flyerId }, data: { status: 'RENDERING', error: null, url: null, previewUrl: null } });
      const base = getBaseUrlFromHeaders(req);
      const qrUrl = qrTargetForVariant(id, flyer.variantKey as any, base);
      const { pdf, previewJpeg, widthPx, heightPx } = await renderFlyer({
        address,
        realtor: {
          name: `${r?.firstName || ''} ${r?.lastName || ''}`.trim(),
          phone: r?.phone || '',
          email: r?.email || '',
          headshot: r?.headshot || undefined,
          logo: r?.companyLogo || undefined,
        },
        images,
        beds: order.bedrooms || '',
        baths: order.bathrooms || '',
        sizeSqFt: order.propertySize || undefined,
        qrUrl,
        variant: flyer.variantKey as any,
      });

      const basePath = `orders/${id}/flyers`;
      const pdfName = `${flyer.variantKey}-${Date.now()}.pdf`;
      const jpgName = `${flyer.variantKey}-${Date.now()}.jpg`;
      const { fileUrl: pdfUrl } = await uploadBufferToS3WithPath(basePath, pdfName, pdf, 'application/pdf');
      const { fileUrl: previewUrl } = await uploadBufferToS3WithPath(`${basePath}/previews`, jpgName, previewJpeg, 'image/jpeg');

      await prisma.orderFlyer.update({
        where: { id: flyerId },
        data: { status: 'COMPLETE', url: pdfUrl, previewUrl, pageWidth: widthPx, pageHeight: heightPx },
      });
      return NextResponse.json({ ok: true });
    } catch (err: any) {
      await prisma.orderFlyer.update({ where: { id: flyerId }, data: { status: 'FAILED', error: String(err?.message || err) } });
      return NextResponse.json({ error: 'Failed to regenerate', details: String(err?.message || err) }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Retry failed' }, { status: 500 });
  }
}

