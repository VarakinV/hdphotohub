import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { listCalendars } from "@/lib/google/calendar";

export async function GET(_req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const adminId = (session.user as any).id as string;

  try {
    const items = await listCalendars(adminId);
    if (!items) return NextResponse.json({ error: "Not connected" }, { status: 409 });

    const calendars = items.map((c) => ({
      id: c.id!,
      summary: c.summary || c.id || "(no title)",
      primary: !!c.primary,
    }));

    return NextResponse.json({ calendars });
  } catch (e) {
    console.warn('[Google] Failed to list calendars', e);
    return NextResponse.json({ error: "Not connected" }, { status: 409 });
  }
}

