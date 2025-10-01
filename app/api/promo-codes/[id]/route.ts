import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth/auth';
import { prisma } from '@/lib/db/prisma';

function parseDate(d?: string | null) {
  if (!d) return null;
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === 'ADMIN' || me.role === 'SUPERADMIN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
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
      active,
      serviceIds,
    } = body || {};

    const updateData: any = {};
    const errors: Record<string, string> = {};
    if (displayName !== undefined) {
      if (String(displayName).trim().length === 0) errors.displayName = 'Display Name is required';
      else updateData.displayName = String(displayName).trim();
    }
    if (code !== undefined) {
      if (String(code).trim().length === 0) errors.code = 'Promo Code is required';
      else updateData.code = String(code).trim();
    }

    if (startDate !== undefined) updateData.startDate = parseDate(startDate);
    if (endDate !== undefined) updateData.endDate = parseDate(endDate);

    if (maxUsesPerRealtor !== undefined)
      updateData.maxUsesPerRealtor = maxUsesPerRealtor === '' || maxUsesPerRealtor == null ? null : Number(maxUsesPerRealtor);
    if (maxUsesTotal !== undefined)
      updateData.maxUsesTotal = maxUsesTotal === '' || maxUsesTotal == null ? null : Number(maxUsesTotal);

    if (discountType !== undefined) {
      if (!(discountType === 'AMOUNT' || discountType === 'PERCENT')) errors.discountType = 'Invalid type';
      else updateData.discountType = discountType;
    }

    if (discountValueDollars !== undefined && (updateData.discountType === 'AMOUNT' || discountType === 'AMOUNT')) {
      const dollars = Number(discountValueDollars ?? '');
      if (!(dollars >= 0)) errors.discountValueDollars = 'Enter a valid amount';
      updateData.discountValueCents = Math.round((dollars || 0) * 100);
      updateData.discountRateBps = null;
    }
    if (discountPercent !== undefined && (updateData.discountType === 'PERCENT' || discountType === 'PERCENT')) {
      const pct = Number(discountPercent ?? '');
      if (!(pct > 0 && pct <= 100)) errors.discountPercent = 'Enter 1–100%';
      updateData.discountRateBps = Math.round(pct * 100);
      updateData.discountValueCents = null;
    }

    if (active !== undefined) updateData.active = Boolean(active);

    if (Object.keys(errors).length)
      return NextResponse.json({ error: 'Validation failed', details: errors }, { status: 422 });

    const where = me.role === 'SUPERADMIN' ? { id } : { id, adminId: me.id };

    const updated = await prisma.$transaction(async (tx) => {
      const row = await tx.promoCode.update({ where, data: updateData });
      if (serviceIds) {
        await tx.promoCodeService.deleteMany({ where: { promoCodeId: id } });
        if (Array.isArray(serviceIds) && serviceIds.length) {
          await tx.promoCodeService.createMany({
            data: serviceIds.map((sid: string) => ({ promoCodeId: id, serviceId: sid })),
            skipDuplicates: true,
          });
        }
      }
      return row;
    });

    const withServices = await prisma.promoCode.findUnique({
      where: { id: updated.id },
      include: { services: { select: { serviceId: true } } },
    });

    return NextResponse.json({
      ...withServices!,
      serviceIds: withServices!.services.map((s) => s.serviceId),
    });
  } catch (e: any) {
    console.error(e);
    if (e?.code === 'P2002') {
      return NextResponse.json(
        { error: 'Promo Code already exists for this account', details: { code: 'Already exists' } },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: 'Failed to update promo code' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === 'ADMIN' || me.role === 'SUPERADMIN'))
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

    const { id } = await params;
    const where = me.role === 'SUPERADMIN' ? { id } : { id, adminId: me.id };

    await prisma.promoCode.delete({ where });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to delete promo code' }, { status: 500 });
  }
}

