import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { sendBookingReminderToGhl } from '@/lib/ghl';

export const dynamic = 'force-dynamic';

// Sends a GHL reminder (~24h before the photoshoot) for each upcoming confirmed booking.
//
// Re-entrant by design: every tick scans for bookings whose `start` falls inside
//   [now + HOURS_BEFORE - WINDOW_MIN, now + HOURS_BEFORE]
// This makes reschedules and cancellations self-healing:
//   - Rescheduled → the booking re-enters the window for the new time and, because
//     `reminderForStart` no longer matches the new `start`, is sent again.
//   - Cancelled   → status != CONFIRMED, so it is never picked up.
//   - Created < 24h before start → excluded via the `createdAt` grace check.
//
// Env overrides (defaults tuned for a 15-minute cron):
//   GHL_REMINDER_HOURS_BEFORE  default 24
//   GHL_REMINDER_WINDOW_MIN    default 60

function parsePositiveNum(value: string | undefined, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

function splitName(name: string): { firstName: string; lastName?: string } {
  const parts = String(name || '').trim().split(/\s+/);
  if (parts.length === 0 || parts[0] === '') return { firstName: 'Client' };
  const [firstName, ...rest] = parts;
  return { firstName, lastName: rest.join(' ') || undefined };
}

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const hoursBefore = parsePositiveNum(process.env.GHL_REMINDER_HOURS_BEFORE, 24);
    const windowMin = parsePositiveNum(process.env.GHL_REMINDER_WINDOW_MIN, 60);

    const now = Date.now();
    const rangeEnd = new Date(now + hoursBefore * 60 * 60 * 1000);
    const rangeStart = new Date(now + Math.max(0, hoursBefore * 60 - windowMin) * 60 * 1000);
    const minLeadMs = hoursBefore * 60 * 60 * 1000; // booking must exist this far ahead of start

    const candidates = await prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        start: { gte: rangeStart, lte: rangeEnd },
      },
      select: {
        id: true,
        start: true,
        createdAt: true,
        timeZone: true,
        contactName: true,
        contactEmail: true,
        contactPhone: true,
        propertyAddress: true,
        propertyFormattedAddress: true,
        reminderForStart: true,
      },
    });

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const booking of candidates) {
      // Only remind bookings that were created at least HOURS_BEFORE ahead of start
      if (booking.start.getTime() - booking.createdAt.getTime() < minLeadMs) {
        skipped++;
        continue;
      }
      // Already reminded for this exact start time
      if (booking.reminderForStart && booking.reminderForStart.getTime() === booking.start.getTime()) {
        skipped++;
        continue;
      }

      // Atomic claim so concurrent ticks do not send duplicates
      const claimed = await prisma.booking.updateMany({
        where: {
          id: booking.id,
          OR: [
            { reminderForStart: null },
            { reminderForStart: { not: booking.start } },
          ],
        },
        data: { reminderForStart: booking.start },
      });
      if (claimed.count === 0) {
        skipped++;
        continue;
      }

      const { firstName, lastName } = splitName(booking.contactName);
      const ok = await sendBookingReminderToGhl({
        contactFirstName: firstName,
        contactLastName: lastName,
        contactEmail: booking.contactEmail,
        contactPhone: booking.contactPhone,
        address: booking.propertyFormattedAddress || booking.propertyAddress,
        startISO: booking.start.toISOString(),
        timeZone: booking.timeZone,
      });

      if (ok) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderSentAt: new Date() },
        });
        sent++;
      } else {
        // Release the claim so the next tick retries while the booking is still in window
        await prisma.booking.update({
          where: { id: booking.id },
          data: { reminderForStart: null },
        });
        failed++;
      }
    }

    return NextResponse.json({
      ok: true,
      scanned: candidates.length,
      sent,
      failed,
      skipped,
      window: { rangeStart: rangeStart.toISOString(), rangeEnd: rangeEnd.toISOString() },
    });
  } catch (e) {
    console.error('[CRON booking-reminders]', e);
    return NextResponse.json({ error: 'Failed to process booking reminders' }, { status: 500 });
  }
}