import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { calculateTravelFee, getTravelFeeConfigForAdmin } from "@/lib/travel/fee";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { lat, lng, city, formattedAddress, adminSlug } = body as {
      lat?: number | null;
      lng?: number | null;
      city?: string | null;
      formattedAddress?: string | null;
      adminSlug?: string | null;
    };

    const admin = adminSlug
      ? await prisma.user.findFirst({
          where: {
            AND: [
              { OR: [{ role: "ADMIN" as any }, { role: "SUPERADMIN" as any }] },
              { OR: [{ adminSlug }, { id: adminSlug }] },
            ],
          },
          select: { id: true },
        })
      : null;
    const config = await getTravelFeeConfigForAdmin(admin?.id);

    const result = await calculateTravelFee({
      lat: lat ?? null,
      lng: lng ?? null,
      city: city || null,
      formattedAddress: formattedAddress || null,
      config,
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[TRAVEL-FEE-API] Error:", err);
    return NextResponse.json(
      {
        distanceMeters: 0,
        durationSeconds: 0,
        feeCents: 0,
        rule: "FREE",
        description: "Travel fee calculation unavailable.",
        calculatedAt: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
