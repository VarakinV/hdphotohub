import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ adminSlug: string }> }) {
  try {
    const { adminSlug } = await params;
    if (!adminSlug) return NextResponse.json({ error: "Missing adminSlug" }, { status: 400 });

    // Accept either public adminSlug or the Admin's id
    const idOrSlug = adminSlug;
    const admin = await prisma.user.findFirst({
      where: {
        AND: [
          { OR: [{ role: "ADMIN" as any }, { role: "SUPERADMIN" as any }] },
          { OR: [{ adminSlug: idOrSlug }, { id: idOrSlug }] },
        ],
      },
      select: { id: true, name: true, email: true, adminSlug: true },
    });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // Settings + rules for client-side awareness (slot generation will have its own API)
    const [settings, rules, blackouts] = await Promise.all([
      prisma.adminBookingSettings.findUnique({ where: { adminId: admin.id } }),
      prisma.adminAvailabilityRule.findMany({ where: { adminId: admin.id, active: true }, orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] }),
      prisma.blackoutDate.findMany({ where: { adminId: admin.id } }),
    ]);

    // Categories and Services (active only)
    const categories = await prisma.serviceCategory.findMany({
      where: { adminId: admin.id, active: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        description: true,
        iconKey: true,
        featured: true,
        sortOrder: true,
        services: {
          where: { active: true },
          orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            description: true,
            priceCents: true,
            durationMin: true,
            bufferBeforeMin: true,
            bufferAfterMin: true,
            minSqFt: true,
            maxSqFt: true,
            taxes: { select: { tax: { select: { id: true, name: true, rateBps: true } } } },
          },
        },
      },
    });

    const payload = {
      admin,
      settings,
      availability: { rules, blackouts },
      categories: categories.map((c) => ({
        ...c,
        services: c.services.map((s) => ({
          ...s,
          taxRatesBps: s.taxes.map((t) => t.tax.rateBps),
        })),
      })),
      note: "Displayed prices are estimates. Final charges may vary based on verified property square footage, selected services, and travel distance.",
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch booking catalog" }, { status: 500 });
  }
}

