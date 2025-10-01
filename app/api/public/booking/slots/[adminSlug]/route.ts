import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateSlots } from "@/lib/booking/slots";
import { getFreeBusy } from "@/lib/google/calendar";

export async function POST(req: NextRequest, { params }: { params: Promise<{ adminSlug: string }> }) {
  try {
    const { adminSlug } = await params;
    const body = await req.json().catch(() => ({}));
    const { serviceIds, rangeStart, rangeEnd } = body as { serviceIds?: string[]; rangeStart?: string; rangeEnd?: string };

    if (!adminSlug) return NextResponse.json({ error: "Missing adminSlug" }, { status: 400 });
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) return NextResponse.json({ error: "serviceIds required" }, { status: 400 });

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

    const [settings, rules, blackouts, services] = await Promise.all([
      prisma.adminBookingSettings.findUnique({ where: { adminId: admin.id } }),
      prisma.adminAvailabilityRule.findMany({ where: { adminId: admin.id, active: true }, orderBy: [{ dayOfWeek: "asc" }, { startMinutes: "asc" }] }),
      prisma.blackoutDate.findMany({ where: { adminId: admin.id } }),
      prisma.service.findMany({ where: { adminId: admin.id, id: { in: serviceIds }, active: true }, select: { id: true, durationMin: true, bufferBeforeMin: true, bufferAfterMin: true } }),
    ]);

    if (!settings) return NextResponse.json({ error: "Booking settings not configured" }, { status: 409 });

    // Sanitize date inputs to prevent infinite loops on invalid dates
    const isValidDate = (d: Date) => !isNaN(d.getTime());
    const now = new Date();
    const clientStart = rangeStart ? new Date(rangeStart) : null;
    const clientEnd = rangeEnd ? new Date(rangeEnd) : null;
    const maxEnd = new Date(now.getTime() + (settings.maxAdvanceDays ?? 14) * 24 * 60 * 60 * 1000);

    const start = isValidDate(clientStart as any) ? (clientStart as Date) : now;
    // Clamp end to maxEnd and apply a hard safety cap of 60 days from start
    const hardCapMs = 60 * 24 * 60 * 60 * 1000; // 60 days
    let end = isValidDate(clientEnd as any) ? (clientEnd as Date) : maxEnd;
    const safeLatest = new Date(Math.min(maxEnd.getTime(), start.getTime() + hardCapMs));
    if (end.getTime() > safeLatest.getTime()) end = safeLatest;
    if (end.getTime() < start.getTime()) end = new Date(start.getTime());

    console.time(`[SLOTS] gen ${start.toISOString()} -> ${end.toISOString()}`);
    const slots = generateSlots({
      rangeStart: start,
      rangeEnd: end,
      settings,
      rules,
      blackouts,
      services,
      slotIntervalMin: 30,
    });
    console.timeEnd(`[SLOTS] gen ${start.toISOString()} -> ${end.toISOString()}`);

    // Google Calendar overlay (if connected)
    let finalSlots = slots;
    try {
      const busy = await getFreeBusy(
        admin.id,
        settings.googleCalendarId ?? null,
        start.toISOString(),
        end.toISOString(),
        settings.timeZone || undefined
      );
      if (Array.isArray(busy) && busy.length) {
        finalSlots = slots.filter((s) => {
          return !busy.some((b) => new Date(b.start) < s.end && new Date(b.end) > s.start);
        });
      }
    } catch (e) {
      console.warn('[SLOTS] Google FreeBusy failed, falling back to internal only', e);
    }

    return NextResponse.json({ slots: finalSlots });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to generate slots" }, { status: 500 });
  }
}

