import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const where: any = { adminId: me.id };
    if (status) where.status = status as any;
    if (start || end) {
      where.start = { ...(start ? { gte: new Date(start) } : {}), ...(end ? { lte: new Date(end) } : {}) };
    }

    const rows = await prisma.booking.findMany({
      where,
      orderBy: [{ start: "desc" }],
      select: {
        id: true,
        status: true,
        start: true,
        end: true,
        propertyFormattedAddress: true,
        propertyAddress: true,
        contactName: true,
        contactEmail: true,
        totalCents: true,
      },
    });

    return NextResponse.json(rows);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch bookings" }, { status: 500 });
  }
}

