import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { getEventForAdmin } from "@/lib/google/calendar";

export async function POST(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const booking = await prisma.booking.findFirst({ where: me.role === 'SUPERADMIN' ? { id } : { id, adminId: me.id } });
    if (!booking) return NextResponse.json({ error: 'Not found' }, { status: 404 });
    if (!booking.googleEventId) return NextResponse.json({ error: 'No linked Google event' }, { status: 409 });

    const settings = await prisma.adminBookingSettings.findUnique({ where: { adminId: booking.adminId } });
    const calendarId = settings?.googleCalendarId || undefined;

    const event = await getEventForAdmin(booking.adminId, calendarId, booking.googleEventId);
    if (!event) return NextResponse.json({ error: 'Failed to fetch event' }, { status: 502 });

    // Map Google event -> Booking
    const startISO = (event.start as any)?.dateTime || (event.start as any)?.date; // date for all-day
    const endISO = (event.end as any)?.dateTime || (event.end as any)?.date;
    const status = event.status === 'cancelled' ? 'CANCELLED' : undefined;

    // If the event has an explicit end, we keep our internal buffer logic; we set booking.start to event start
    // and recompute booking.end using services + buffers to keep internal scheduling consistent.
    const items = await prisma.bookingService.findMany({ where: { bookingId: booking.id }, include: { service: true } });
    const coreDurationMin = items.reduce((acc, r) => acc + (r.service?.durationMin || 0), 0);
    const beforeBufferMin = items.reduce((acc, r) => acc + (r.service?.bufferBeforeMin || 0), 0);
    const afterBufferMin = items.reduce((acc, r) => acc + (r.service?.bufferAfterMin || 0), 0);
    const defaultBufferMin = settings?.defaultBufferMin || 0;

    const nextStart = startISO ? new Date(startISO) : booking.start;
    const nextEnd = new Date(nextStart.getTime() + (coreDurationMin + beforeBufferMin + afterBufferMin + defaultBufferMin) * 60 * 1000);

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        start: nextStart,
        end: nextEnd,
        ...(status ? { status: status as any } : {}),
      },
    });

    return NextResponse.json({ ok: true, booking: updated, event });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to sync from Google' }, { status: 500 });
  }
}

