import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminId = (session.user as any).id as string;

  const account = await prisma.account.findFirst({ where: { userId: adminId, provider: "google" } });
  const settings = await prisma.adminBookingSettings.findUnique({ where: { adminId } });

  return NextResponse.json({
    connected: !!account,
    calendarId: settings?.googleCalendarId || null,
  });
}

