import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { J2VProvider } from '@/lib/video/j2v-provider';

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
    case 'h1-16x9':
    case 'v2-16x9':
    default:
      return { width: 1920, height: 1080 };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const order = await prisma.order.findUnique({
      where: { id },
      include: { realtor: { select: { id: true, firstName: true, lastName: true, phone: true, headshot: true, companyLogo: true } } },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Sources 3..6
    const sources = await prisma.orderReelSourceImage.findMany({ where: { orderId: id }, orderBy: { sortOrder: 'asc' } });
    if (sources.length < 3) return NextResponse.json({ error: 'At least 3 images required' }, { status: 400 });
    if (sources.length > 6) return NextResponse.json({ error: 'Max 6 images allowed' }, { status: 400 });

    // Required fields
    const missing: string[] = [];
    const r = order.realtor as any;
    if (!r?.headshot) missing.push('Realtor headshot');
    if (!r?.companyLogo) missing.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) missing.push('Realtor name');
    if (!r?.phone) missing.push('Realtor phone');
    if (!order.listPrice) missing.push('List price');
    if (!order.bedrooms) missing.push('Bedrooms');
    if (!order.bathrooms) missing.push('Bathrooms');
    if (!order.propertyAddress && !order.propertyFormattedAddress) missing.push('Property address');
    if (missing.length) return NextResponse.json({ error: 'Missing fields', missing }, { status: 400 });

    // Guard: cap total reels per order
    const existingCount = await prisma.orderReel.count({ where: { orderId: id } });
    if (existingCount >= 12) return NextResponse.json({ error: 'Max reels reached' }, { status: 400 });

    const VARIANTS: Array<{ key: string; templateId?: string }> = [];

    const templateH1 = (process.env.JSON2VIDEO_TEMPLATE_ID_H1 || '').trim(); // 1920x1080
    const templateV1 = (process.env.JSON2VIDEO_TEMPLATE_ID_V1 || '').trim(); // 1080x1920
    const templateV2 = (process.env.JSON2VIDEO_TEMPLATE_ID_V2 || '').trim(); // 1080x1920
    const templateV3 = (process.env.JSON2VIDEO_TEMPLATE_ID_V3 || '').trim(); // 1080x1920
    const templateV4 = (process.env.JSON2VIDEO_TEMPLATE_ID_V4 || '').trim(); // 1080x1920
    const templateV5 = (process.env.JSON2VIDEO_TEMPLATE_ID_V5 || '').trim(); // 1080x1920
    const templateV6 = (process.env.JSON2VIDEO_TEMPLATE_ID_V6 || '').trim(); // 1080x1920
    const templateV7 = (process.env.JSON2VIDEO_TEMPLATE_ID_V7 || '').trim(); // 1080x1920
    const templateV8 = (process.env.JSON2VIDEO_TEMPLATE_ID_V8 || '').trim(); // 1080x1920
    const templateV9 = (process.env.JSON2VIDEO_TEMPLATE_ID_V9 || '').trim(); // 1080x1920

    if (templateH1) VARIANTS.push({ key: 'h1-16x9', templateId: templateH1 });
    if (templateV1) VARIANTS.push({ key: 'v1-9x16', templateId: templateV1 });
    if (templateV2) VARIANTS.push({ key: 'v2-9x16', templateId: templateV2 });
    if (templateV3) VARIANTS.push({ key: 'v3-9x16', templateId: templateV3 });
    if (templateV4) VARIANTS.push({ key: 'v4-9x16', templateId: templateV4 });
    if (templateV5) VARIANTS.push({ key: 'v5-9x16', templateId: templateV5 });
    if (templateV6) VARIANTS.push({ key: 'v6-9x16', templateId: templateV6 });
    if (templateV7) VARIANTS.push({ key: 'v7-9x16', templateId: templateV7 });
    if (templateV8) VARIANTS.push({ key: 'v8-9x16', templateId: templateV8 });
    if (templateV9) VARIANTS.push({ key: 'v9-9x16', templateId: templateV9 });

    if (VARIANTS.length === 0) {
      return NextResponse.json({ error: 'No JSON2Video template IDs configured' }, { status: 400 });
    }

    const toCreate = VARIANTS.slice(0, Math.min(VARIANTS.length, 12 - existingCount)).map((v) => ({
      orderId: id,
      variantKey: v.key,
      provider: 'j2v',
      renderId: 'pending',
      status: 'QUEUED' as const,
    }));

    const created = await prisma.$transaction(toCreate.map((d) => prisma.orderReel.create({ data: d })));

    const templateMap = new Map<string, string>();
    for (const v of VARIANTS) if (v.templateId) templateMap.set(v.key, v.templateId);

    // Webhook URL
    const hdrs = req.headers;
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

    const provider = new J2VProvider();
    const images = sources.map((s) => s.url);

    // Address & realtor info
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
    } as const;

    // Build template variables via merge array (1..6 images)
    const merge = [
      { find: 'ADDRESS', replace: street || '' },
      { find: 'CITY', replace: city || '' },
      { find: 'POSTCODE', replace: postal || '' },
      { find: 'BEDROOMS', replace: String(order.bedrooms || '') },
      { find: 'BATHROOMS', replace: String(order.bathrooms || '') },
      ...images.slice(0, 6).map((url, i) => ({ find: `IMAGE_${i + 1}`, replace: url })),
      { find: 'AGENT_PICTURE', replace: rinfo?.headshot || '' },
      { find: 'AGENT_NAME', replace: `${rinfo?.firstName || ''} ${rinfo?.lastName || ''}`.trim() },
      { find: 'AGENT_PHONE', replace: rinfo?.phone || '' },
      { find: 'AGENCY_LOGO', replace: rinfo?.companyLogo || '' },
    ];

    await Promise.all(
      created.map(async (row) => {
        try {
          const tid = templateMap.get(row.variantKey);
          const { renderId } = await provider.render({
            images,
            variantKey: row.variantKey as any,
            webhookUrl: webhookUrl || '',
            meta: { ...meta, orderId: id, reelId: row.id },
            ...(tid ? { templateId: tid, merge } : {}),
          });
          const { width, height } = dimsForVariant(row.variantKey);
          await prisma.orderReel.update({ where: { id: row.id }, data: { renderId, status: 'RENDERING', width, height } });
        } catch (err: any) {
          await prisma.orderReel.update({ where: { id: row.id }, data: { status: 'FAILED', error: String(err?.message || err) } });
        }
      })
    );

    return NextResponse.json({ ok: true, created: created.map((c) => c.id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to queue J2V reels' }, { status: 500 });
  }
}

