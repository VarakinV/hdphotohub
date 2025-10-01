import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminId = (session.user as any).id as string;

  await prisma.account.deleteMany({ where: { userId: adminId, provider: 'google' } });
  await prisma.adminBookingSettings.updateMany({ where: { adminId }, data: { googleCalendarId: null } });

  return NextResponse.json({ ok: true });
}

