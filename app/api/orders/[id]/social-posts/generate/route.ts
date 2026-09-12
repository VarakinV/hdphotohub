import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';
import { isS3Available } from '@/lib/utils/s3';

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!isS3Available()) return NextResponse.json({ error: 'S3 not configured' }, { status: 503 });

    const { id } = await params;
    const user = session.user as any;
    const realtorId = user?.realtorId as string | undefined;

    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        realtor: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
            email: true,
            headshot: true,
            companyLogo: true,
            companyName: true,
          },
        },
      },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    const isAdmin = user?.role === 'ADMIN' || user?.role === 'SUPERADMIN';
    if (!isAdmin) {
      if (!realtorId || order.realtorId !== realtorId) return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const sources = await prisma.orderReelSourceImage.findMany({ where: { orderId: id }, orderBy: { sortOrder: 'asc' } });
    if (sources.length < 1) return NextResponse.json({ error: 'At least 1 image required' }, { status: 400 });

    const r = order.realtor as any;
    const missing: string[] = [];
    if (!r?.headshot) missing.push('Realtor headshot');
    if (!r?.companyLogo) missing.push('Brokerage logo');
    if (!r?.firstName || !r?.lastName) missing.push('Realtor name');
    if (!r?.phone) missing.push('Realtor phone');
    if (!order.bedrooms) missing.push('Bedrooms');
    if (!order.bathrooms) missing.push('Bathrooms');
    if (!order.propertySize) missing.push('Size (sq ft)');
    if (!order.propertyAddress && !order.propertyFormattedAddress) missing.push('Property address');
    if (missing.length) return NextResponse.json({ error: 'Missing fields', missing }, { status: 400 });

    const activeTemplates = await prisma.socialPostTemplate.findMany({
      where: { status: 'active' },
      orderBy: { sortOrder: 'asc' },
    });
    if (!activeTemplates.length) return NextResponse.json({ error: 'No active social templates' }, { status: 400 });

    const existing = await prisma.orderSocialPost.findMany({
      where: { orderId: id, variantKey: { in: activeTemplates.map((t) => t.variantKey) } },
      select: { variantKey: true },
    });
    const existingKeys = new Set(existing.map((e) => e.variantKey));
    const toCreate = activeTemplates.filter((t) => !existingKeys.has(t.variantKey));
    if (!toCreate.length) {
      return NextResponse.json({ ok: true, created: [] });
    }

    const created = await prisma.$transaction(
      toCreate.map((t) =>
        prisma.orderSocialPost.create({
          data: { orderId: id, variantKey: t.variantKey, status: 'QUEUED' },
        })
      )
    );
    return NextResponse.json({ ok: true, created: created.map((c) => c.id) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to generate social posts' }, { status: 500 });
  }
}
