import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { transformToTwilight } from '@/lib/kie/kie-provider';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await params;
    const user = session.user as any;

    // Admin/superadmin only
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        realtor: {
          select: {
            id: true, firstName: true, lastName: true,
            phone: true, headshot: true, companyLogo: true,
          },
        },
      },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Validate required fields
    const missing: string[] = [];
    const r = order.realtor as any;
    if (!r?.headshot) missing.push('Realtor headshot');
    if (!r?.companyLogo) missing.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) missing.push('Realtor name');
    if (!r?.phone) missing.push('Realtor phone');
    if (!order.propertyAddress && !order.propertyFormattedAddress) missing.push('Property address');
    if (missing.length) return NextResponse.json({ error: 'Missing fields', missing }, { status: 400 });

    // Parse body - expects sourceImageUrl (already uploaded to S3)
    const body = await req.json().catch(() => ({}));
    const sourceImageUrl = body.sourceImageUrl as string;
    if (!sourceImageUrl) {
      return NextResponse.json({ error: 'sourceImageUrl is required' }, { status: 400 });
    }

    // Cap AI reels per order
    const existingCount = await prisma.orderAiReel.count({ where: { orderId: id } });
    if (existingCount >= 5) {
      return NextResponse.json({ error: 'Max 5 AI reels per order' }, { status: 400 });
    }

    // Build Kie.ai callback URL
    const kieCallbackUrl = buildKieCallbackUrl(req);

    // Create the AI reel record
    const aiReel = await prisma.orderAiReel.create({
      data: {
        orderId: id,
        sourceImageUrl,
        kieImageStatus: 'PROCESSING',
      },
    });

    // Step 1: Call Kie.ai to transform daytime → twilight
    try {
      const { taskId } = await transformToTwilight(sourceImageUrl, `${kieCallbackUrl}?aiReelId=${aiReel.id}&step=image`);
      await prisma.orderAiReel.update({
        where: { id: aiReel.id },
        data: { kieImageTaskId: taskId },
      });
    } catch (err: any) {
      await prisma.orderAiReel.update({
        where: { id: aiReel.id },
        data: { kieImageStatus: 'FAILED', error: String(err?.message || err) },
      });
      return NextResponse.json({ error: 'Failed to start image transformation', detail: err?.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, aiReelId: aiReel.id });
  } catch (e: any) {
    console.error('AI reel generate error:', e?.message || e, e?.stack);
    return NextResponse.json({ error: 'Failed to generate AI reel', detail: e?.message }, { status: 500 });
  }
}

function buildKieCallbackUrl(req: NextRequest): string {
  const hdrs = req.headers;
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const explicitWebhook = process.env.KIE_WEBHOOK_URL?.trim();
  const fallbackBase = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');

  if (explicitWebhook) {
    const base = explicitWebhook.replace(/\/$/, '');
    return `${base}/api/integrations/kie/webhook`;
  }

  const base = (fallbackBase || '').replace(/\/$/, '');
  return `${base}/api/integrations/kie/webhook`;
}
