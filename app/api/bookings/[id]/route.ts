import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const row = await prisma.booking.findFirst({
      where: me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id },
      include: {
        items: {
          include: {
            service: {
              select: {
                category: { select: { name: true, description: true } },
              },
            },
          },
        },
        realtor: true,
        appliedPromoCode: { select: { id: true, code: true, displayName: true } },
      },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch booking" }, { status: 500 });
  }
}



export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json().catch(() => ({}));

    const existing = await prisma.booking.findFirst({
      where: me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id },
      include: { items: { include: { service: true } }, admin: { select: { id: true, email: true } } },
    });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const settings = await prisma.adminBookingSettings.findUnique({ where: { adminId: existing.adminId } });

    // derive durations and buffers
    const coreDurationMin = existing.items.reduce((acc, r) => acc + (r.service?.durationMin || 0), 0);
    const beforeBufferMin = existing.items.reduce((acc, r) => acc + (r.service?.bufferBeforeMin || 0), 0);
    const afterBufferMin = existing.items.reduce((acc, r) => acc + (r.service?.bufferAfterMin || 0), 0);
    const defaultBufferMin = settings?.defaultBufferMin || 0;

    // allow reschedule: update start/end if provided
    const nextStart = body.start ? new Date(String(body.start)) : existing.start;
    const nextEnd = new Date(nextStart.getTime() + (coreDurationMin + beforeBufferMin + afterBufferMin + defaultBufferMin) * 60 * 1000);

    const updateData: any = {};
    if ("status" in body) updateData.status = String(body.status) as any;
    if (body.start) {
      updateData.start = nextStart;
      updateData.end = nextEnd;
    }

    const updated = await prisma.booking.update({ where: { id: existing.id }, data: updateData });

    // Sync Google Calendar on status change or reschedule
    try {
      const calendarId = settings?.googleCalendarId || undefined;

      // Work-only time in Google event
      const eventStart = new Date((body.start ? nextStart : updated.start).getTime());
      const eventEnd = new Date(eventStart.getTime() + coreDurationMin * 60 * 1000);

      if (updateData.status === "CANCELLED") {
        if (existing.googleEventId) {
          const { deleteEventForAdmin } = await import("@/lib/google/calendar");
          await deleteEventForAdmin(existing.adminId, calendarId, existing.googleEventId);
          await prisma.booking.update({ where: { id: existing.id }, data: { googleEventId: null } });
        }
      } else if (updateData.status === "CONFIRMED") {
        const addressStr = existing.propertyFormattedAddress || existing.propertyAddress || "";
        const summary = `${addressStr} - ${existing.contactName || "Booking"}`;
        const { updateEventForAdmin, createEventForAdmin } = await import("@/lib/google/calendar");
        if (existing.googleEventId) {
          await updateEventForAdmin(existing.adminId, {
            calendarId,
            eventId: existing.googleEventId,
            summary,
            startISO: eventStart.toISOString(),
            endISO: eventEnd.toISOString(),
            timeZone: existing.timeZone,
          });
        } else {
          const event = await createEventForAdmin(existing.adminId, {
            calendarId,
            summary,
            startISO: eventStart.toISOString(),
            endISO: eventEnd.toISOString(),
            timeZone: existing.timeZone,
          });
          if (event?.id) await prisma.booking.update({ where: { id: existing.id }, data: { googleEventId: event.id } });
        }
      } else if (body.start && existing.googleEventId) {
        // Reschedule without status change: update event timing
        const addressStr = existing.propertyFormattedAddress || existing.propertyAddress || "";
        const summary = `${addressStr} - ${existing.contactName || "Booking"}`;
        const { updateEventForAdmin } = await import("@/lib/google/calendar");
        await updateEventForAdmin(existing.adminId, {
          calendarId,
          eventId: existing.googleEventId,
          summary,
          startISO: eventStart.toISOString(),
          endISO: eventEnd.toISOString(),
          timeZone: existing.timeZone,
        });
      }
    } catch (e) {
      console.warn('[BOOKING] Calendar sync failed on PATCH', e);
    }

    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update booking" }, { status: 500 });
  }
}
