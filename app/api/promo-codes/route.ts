import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

function parseDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export async function GET(_req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === 'ADMIN' || me.role === 'SUPERADMIN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const where = me.role === 'SUPERADMIN' ? {} : { adminId: me.id };
    const rows = await prisma.promoCode.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { services: { select: { serviceId: true } } },
    });
    return NextResponse.json(
      rows.map((r) => ({
        ...r,
        serviceIds: r.services.map((s) => s.serviceId),
      }))
    );
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to fetch promo codes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === 'ADMIN' || me.role === 'SUPERADMIN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const body = await req.json();
    const {
      displayName,
      code,
      startDate,
      endDate,
      maxUsesPerRealtor,
      maxUsesTotal,
      discountType,
      discountValueDollars,
      discountPercent,
      active = true,
      serviceIds = [],
    } = body || {};

    const errors: Record<string, string> = {};
    if (!displayName || String(displayName).trim().length === 0)
      errors.displayName = 'Display Name is required';
    if (!code || String(code).trim().length === 0)
      errors.code = 'Promo Code is required';
    if (!(discountType === 'AMOUNT' || discountType === 'PERCENT'))
      errors.discountType = 'Select discount type';
    let discountValueCents: number | null = null;
    let discountRateBps: number | null = null;
    if (discountType === 'AMOUNT') {
      const dollars = Number(discountValueDollars ?? '');
      if (!(dollars >= 0)) errors.discountValueDollars = 'Enter a valid amount';
      discountValueCents = Math.round((dollars || 0) * 100);
    } else if (discountType === 'PERCENT') {
      const pct = Number(discountPercent ?? '');
      if (!(pct > 0 && pct <= 100))
        errors.discountPercent = 'Enter 1–100%';
      discountRateBps = Math.round(pct * 100);
    }

    if (Object.keys(errors).length)
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 });

    const created = await prisma.promoCode.create({
      data: {
        adminId: me.id,
        displayName: String(displayName).trim(),
        code: String(code).trim(),
        startDate: parseDate(startDate) ?? new Date(),
        endDate: parseDate(endDate),
        maxUsesPerRealtor: maxUsesPerRealtor != null && maxUsesPerRealtor !== '' ? Number(maxUsesPerRealtor) : null,
        maxUsesTotal: maxUsesTotal != null && maxUsesTotal !== '' ? Number(maxUsesTotal) : null,
        discountType,
        discountRateBps,
        discountValueCents,
        active: Boolean(active),
        services: {
          createMany: {
            data: (serviceIds as string[]).map((sid) => ({ serviceId: sid })),
            skipDuplicates: true,
          },
        },
      },
      include: { services: { select: { serviceId: true } } },
    });

    return NextResponse.json({
      ...created,
      serviceIds: created.services.map((s) => s.serviceId),
    });
  } catch (e: any) {
    console.error(e);
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Promo Code already exists for this account', details: { code: 'Already exists' } },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to create promo code' }, { status: 500 });
  }
}

