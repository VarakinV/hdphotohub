import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { ShotstackProvider } from '@/lib/video/shotstack-provider';
import { J2VProvider } from '@/lib/video/j2v-provider';
import { formatPhoneNumber } from '@/lib/utils';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string; reelId: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id, reelId } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const reel = await prisma.orderReel.findUnique({ where: { id: reelId } });
    if (!reel || reel.orderId !== id) return NextResponse.json({ error: 'Reel not found' }, { status: 404 });

    // Permission: admin/superadmin or owning realtor
    const order = await prisma.order.findUnique({
      where: { id },
      include: { realtor: { select: { id: true, firstName: true, lastName: true, phone: true, headshot: true, companyLogo: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const sources = await prisma.orderReelSourceImage.findMany({ where: { orderId: id }, orderBy: { sortOrder: 'asc' } });
    if (sources.length < 3) return NextResponse.json({ error: 'Need at least 3 images' }, { status: 400 });

    const hdrs = req.headers;
    const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
    const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
    const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');

    // Shotstack webhook URL
    const explicitWebhook = process.env.SHOTSTACK_WEBHOOK_URL?.trim();
    const token = process.env.SHOTSTACK_WEBHOOK_TOKEN;
    let webhookUrl: string | undefined;
    if (explicitWebhook) {
      const hasPath = /\/api\/integrations\/shotstack\/webhook(\?|$)/i.test(explicitWebhook);
      webhookUrl = hasPath ? explicitWebhook : `${explicitWebhook.replace(/\/$/, '')}/api/integrations/shotstack/webhook`;
      if (token) webhookUrl += (webhookUrl.includes('?') ? '&' : '?') + `token=${token}`;
    } else {
      const base = (fallbackBase || '').replace(/\/$/, '');
      webhookUrl = base ? `${base}/api/integrations/shotstack/webhook${token ? `?token=${token}` : ''}` : undefined;
    }

    // JSON2Video webhook URL
    const explicitWebhookJ2V = process.env.JSON2VIDEO_WEBHOOK_URL?.trim();
    const tokenJ2V = process.env.JSON2VIDEO_WEBHOOK_TOKEN;
    let webhookUrlJ2V: string | undefined;
    if (explicitWebhookJ2V) {
      const hasPathJ2V = /\/api\/integrations\/json2video\/webhook(\?|$)/i.test(explicitWebhookJ2V);
      webhookUrlJ2V = hasPathJ2V ? explicitWebhookJ2V : `${explicitWebhookJ2V.replace(/\/$/, '')}/api/integrations/json2video/webhook`;
      if (tokenJ2V) webhookUrlJ2V += (webhookUrlJ2V.includes('?') ? '&' : '?') + `token=${tokenJ2V}`;
    } else {
      const base = (fallbackBase || '').replace(/\/$/, '');
      webhookUrlJ2V = base ? `${base}/api/integrations/json2video/webhook${tokenJ2V ? `?token=${tokenJ2V}` : ''}` : undefined;
    }

    const isJ2V = (reel.provider || '').toLowerCase() === 'j2v';
    const provider = isJ2V ? new J2VProvider() : new ShotstackProvider();
    const images = sources.map((s) => s.url);

    // Build address and meta similar to initial generate
    const street = order.propertyAddressOverride || order.propertyAddress || '';
    const city = order.propertyCityOverride || order.propertyCity || '';
    const postal = order.propertyPostalCodeOverride || order.propertyPostalCode || '';
    const province = order.propertyProvince || '';
    const formatted = order.propertyFormattedAddress;
    const hasOverrides = !!(order.propertyAddressOverride || order.propertyCityOverride || order.propertyPostalCodeOverride);
    const address = hasOverrides
      ? [street, [city, province].filter(Boolean).join(' '), postal].filter(Boolean).join(', ').replace(/,\s*,/g, ', ').trim()
      : (formatted || [street, [city, province].filter(Boolean).join(' '), postal].filter(Boolean).join(', ').replace(/,\s*,/g, ', ').trim());

    const rinfo = order.realtor as any;
    const meta = {
      address,
      realtorPhone: rinfo?.phone || '',
      realtorHeadshot: rinfo?.headshot || '',
      realtorLogo: rinfo?.companyLogo || '',
      realtorName: `${rinfo?.firstName || ''} ${rinfo?.lastName || ''}`.trim(),
    };

    // Build template merge (same for both templates)
    const merge = [
      { find: 'ADDRESS', replace: street || '' },
      { find: 'CITY', replace: city || '' },
      { find: 'POSTCODE', replace: postal || '' },
      { find: 'BEDROOMS', replace: String(order.bedrooms || '') },
      { find: 'BATHROOMS', replace: String(order.bathrooms || '') },
      // Images 1..6
      ...images.slice(0, 6).map((url, i) => ({ find: `IMAGE_${i + 1}`, replace: url })),
      { find: 'AGENT_PICTURE', replace: rinfo?.headshot || '' },
      { find: 'AGENT_NAME', replace: `${rinfo?.firstName || ''} ${rinfo?.lastName || ''}`.trim() },
      { find: 'AGENT_PHONE', replace: formatPhoneNumber(rinfo?.phone) },
      { find: 'AGENCY_LOGO', replace: rinfo?.companyLogo || '' },
    ];

    try {
      const templateH1S = (process.env.SHOTSTACK_TEMPLATE_ID_H1 || process.env.SHOTSTACK_TEMPLATE_ID || '').trim();
      const templateV1S = (process.env.SHOTSTACK_TEMPLATE_ID_V1 || process.env.SHOTSTACK_TEMPLATE_ID_VERTICAL || '').trim();
      const templateV2S = (process.env.SHOTSTACK_TEMPLATE_ID_V2 || '').trim();

      const templateH1J = (process.env.JSON2VIDEO_TEMPLATE_ID_H1 || '').trim();
      const templateH2J = (process.env.JSON2VIDEO_TEMPLATE_ID_H2 || '').trim();
      const templateV1J = (process.env.JSON2VIDEO_TEMPLATE_ID_V1 || '').trim();
      const templateV2J = (process.env.JSON2VIDEO_TEMPLATE_ID_V2 || '').trim();
      const templateV3J = (process.env.JSON2VIDEO_TEMPLATE_ID_V3 || '').trim();
      const templateV4J = (process.env.JSON2VIDEO_TEMPLATE_ID_V4 || '').trim();
      const templateV5J = (process.env.JSON2VIDEO_TEMPLATE_ID_V5 || '').trim();
      const templateV6J = (process.env.JSON2VIDEO_TEMPLATE_ID_V6 || '').trim();
      const templateV7J = (process.env.JSON2VIDEO_TEMPLATE_ID_V7 || '').trim();
      const templateV8J = (process.env.JSON2VIDEO_TEMPLATE_ID_V8 || '').trim();
      const templateV9J = (process.env.JSON2VIDEO_TEMPLATE_ID_V9 || '').trim();

      const tid = isJ2V
        ? (reel.variantKey === 'h1-16x9' ? templateH1J :
           reel.variantKey === 'h2-16x9' ? templateH2J :
           reel.variantKey === 'v1-9x16' ? templateV1J :
           reel.variantKey === 'v2-9x16' ? templateV2J :
           reel.variantKey === 'v3-9x16' ? templateV3J :
           reel.variantKey === 'v4-9x16' ? templateV4J :
           reel.variantKey === 'v5-9x16' ? templateV5J :
           reel.variantKey === 'v6-9x16' ? templateV6J :
           reel.variantKey === 'v7-9x16' ? templateV7J :
           reel.variantKey === 'v8-9x16' ? templateV8J :
           reel.variantKey === 'v9-9x16' ? templateV9J : '')
        : (reel.variantKey === 'h1-16x9' ? templateH1S :
           reel.variantKey === 'v1-9x16' ? templateV1S :
           reel.variantKey === 'v2-9x16' ? templateV2S :
           reel.variantKey === 'v2-16x9' ? templateH1S :
           reel.variantKey === 'v2-9x16' ? templateV1S : '');

      const { renderId } = await provider.render({ images, variantKey: reel.variantKey as any, webhookUrl: (isJ2V ? webhookUrlJ2V : webhookUrl) || '', meta, ...(tid ? { templateId: tid, merge } : {}) });
      await prisma.orderReel.update({ where: { id: reelId }, data: { renderId, status: 'RENDERING', url: null, thumbnail: null, error: null } });
      return NextResponse.json({ ok: true, renderId });
    } catch (err: any) {
      await prisma.orderReel.update({ where: { id: reelId }, data: { status: 'FAILED', error: String(err?.message || err) } });
      return NextResponse.json({ error: 'Failed to submit render', details: String(err?.message || err) }, { status: 400 });
    }
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Retry failed' }, { status: 500 });
  }
}

