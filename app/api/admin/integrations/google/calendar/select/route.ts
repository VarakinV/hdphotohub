import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminId = (session.user as any).id as string;

  const body = await req.json().catch(() => ({}));
  const calendarId = typeof body.calendarId === 'string' && body.calendarId.trim() ? body.calendarId.trim() : null;

  const saved = await prisma.adminBookingSettings.upsert({
    where: { adminId },
    update: { googleCalendarId: calendarId },
    create: {
      adminId,
      timeZone: 'UTC',
      leadTimeMin: 0,
      maxAdvanceDays: 60,
      defaultBufferMin: 0,
      googleCalendarId: calendarId,
    },
  });

  return NextResponse.json({ ok: true, calendarId: saved.googleCalendarId || null });
}

