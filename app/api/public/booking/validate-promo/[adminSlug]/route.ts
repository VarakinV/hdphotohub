import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest, { params }: { params: Promise<{ adminSlug: string }> }) {
  try {
    const { adminSlug } = await params;
    const body = await req.json().catch(() => ({}));
    const { code, serviceIds, contactEmail } = body as {
      code?: string;
      serviceIds?: string[];
      contactEmail?: string | null;
    };

    if (!adminSlug) return NextResponse.json({ error: "Missing adminSlug" }, { status: 400 });
    if (!code) return NextResponse.json({ error: "Promo Code is required" }, { status: 400 });
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) {
      return NextResponse.json({ error: "Select at least one service before applying a promo code" }, { status: 400 });
    }

    const idOrSlug = adminSlug;
    const admin = await prisma.user.findFirst({
      where: {
        AND: [
          { OR: [{ role: "ADMIN" as any }, { role: "SUPERADMIN" as any }] },
          { OR: [{ adminSlug: idOrSlug }, { id: idOrSlug }] },
        ],
      },
      select: { id: true },
    });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // Find promo by code for this admin
    const promo = await prisma.promoCode.findFirst({
      where: { adminId: admin.id, code },
      include: { services: { select: { serviceId: true } } },
    });
    if (!promo || !promo.active) return NextResponse.json({ error: "Invalid promo code" }, { status: 404 });

    const now = new Date();
    if (promo.startDate && now < promo.startDate) return NextResponse.json({ error: "This promo code is not active yet" }, { status: 400 });
    if (promo.endDate && now > promo.endDate) return NextResponse.json({ error: "This promo code has expired" }, { status: 400 });

    // Which selected services are eligible?
    const eligibleServiceIds = new Set(promo.services.map((s) => s.serviceId));
    const appliesToSubset = eligibleServiceIds.size > 0;
    const selectedEligibleIds = appliesToSubset
      ? serviceIds.filter((id) => eligibleServiceIds.has(id))
      : []; // if none configured, treat as applies-to-none to avoid accidental global codes

    if (appliesToSubset && selectedEligibleIds.length === 0) {
      return NextResponse.json({ error: "This promo code does not apply to the selected services" }, { status: 400 });
    }

    // Compute eligible subtotal
    const svcRows = await prisma.service.findMany({
      where: { adminId: admin.id, id: { in: appliesToSubset ? selectedEligibleIds : serviceIds }, active: true },
      select: { id: true, priceCents: true },
    });
    const eligibleSubtotal = svcRows.reduce((acc, s) => acc + s.priceCents, 0);
    if (eligibleSubtotal <= 0) return NextResponse.json({ error: "Nothing to discount" }, { status: 400 });

    let discountCents = 0;
    if (promo.discountType === "AMOUNT") {
      discountCents = Math.max(0, Math.min(promo.discountValueCents || 0, eligibleSubtotal));
    } else if (promo.discountType === "PERCENT") {
      const bps = promo.discountRateBps || 0; // 10000 bps = 100%
      discountCents = Math.round((eligibleSubtotal * bps) / 10000);
      if (discountCents > eligibleSubtotal) discountCents = eligibleSubtotal;
    }

    // Note: Usage limits (per-realtor and total) will be strictly enforced on submit.
    // If contactEmail is provided, we can soft-check per-realtor remaining uses and return a warning.
    let warning: string | undefined;
    if (contactEmail) {
      const realtor = await prisma.realtor.findUnique({ where: { email: contactEmail } });
      if (promo.maxUsesPerRealtor && realtor) {
        const usedByThis = await prisma.booking.count({ where: { realtorId: realtor.id, appliedPromoCodeId: promo.id } })
          + await prisma.order.count({ where: { realtorId: realtor.id, appliedPromoCodeId: promo.id } });
        if (usedByThis >= promo.maxUsesPerRealtor) {
          warning = "This code has already reached the limit for this client and may be rejected on submit.";
        }
      }
      if (promo.maxUsesTotal) {
        const usedTotal = await prisma.booking.count({ where: { appliedPromoCodeId: promo.id } })
          + await prisma.order.count({ where: { appliedPromoCodeId: promo.id } });
        if (usedTotal >= promo.maxUsesTotal) {
          warning = "This code has reached the maximum number of uses and may be rejected on submit.";
        }
      }
    }

    return NextResponse.json({
      ok: true,
      promoId: promo.id,
      discountCents,
      // If the promo is not restricted to a subset, it applies to all selected services
      appliesToServiceIds: appliesToSubset ? selectedEligibleIds : serviceIds,
      warning,
    });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to validate promo code" }, { status: 500 });
  }
}

