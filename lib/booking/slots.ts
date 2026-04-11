function addMinutes(d: Date, m: number) { return new Date(d.getTime() + m * 60000); }
function startOfUTCDay(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0)); }
function endOfUTCDay(d: Date) { return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 23, 59, 59, 999)); }
function isBefore(a: Date, b: Date) { return a.getTime() < b.getTime(); }
function isAfter(a: Date, b: Date) { return a.getTime() > b.getTime(); }

// Compute the timezone offset (in minutes) for a given instant and IANA time zone.
function getTzOffsetMinutes(at: Date, timeZone: string): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
    hourCycle: 'h23',
  }).formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const ts = Date.UTC(
    Number(map.year), Number(map.month) - 1, Number(map.day),
    Number(map.hour), Number(map.minute), Number(map.second)
  );
  // Difference between wall time (interpreted as UTC) and the actual instant gives offset
  return Math.round((ts - at.getTime()) / 60000);
}

// Build a Date that represents the UTC instant when the wall-clock in `timeZone`
// shows the provided Y/M/D H:M:S.
function makeZonedDate(timeZone: string, y: number, m1: number, d: number, h = 0, min = 0, s = 0): Date {
  const guess = Date.UTC(y, m1 - 1, d, h, min, s);
  const off = getTzOffsetMinutes(new Date(guess), timeZone);
  return new Date(guess - off * 60000);
}

// Get the UTC instant corresponding to local midnight (00:00) of the day that contains `at` in `timeZone`.
function tzStartOfDayUTC(at: Date, timeZone: string): Date {
  // Get local calendar date for the instant `at` in `timeZone`
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
  }).formatToParts(at);
  const map: Record<string, string> = {};
  for (const p of parts) map[p.type] = p.value;
  const y = Number(map.year), m1 = Number(map.month), d = Number(map.day);
  return makeZonedDate(timeZone, y, m1, d, 0, 0, 0);
}

export type BookingSettings = {
  timeZone: string;
  leadTimeMin: number;
  maxAdvanceDays: number;
  defaultBufferMin: number;
};

export type AvailabilityRule = {
  dayOfWeek: number; // 0-6
  startMinutes: number; // since midnight (in rule's time zone)
  endMinutes: number;
  timeZone: string;
  active: boolean;
};

export type Blackout = { start: Date; end: Date };

export type ServiceLike = { durationMin: number; bufferBeforeMin: number; bufferAfterMin: number };

export type SlotRequest = {
  rangeStart: Date;
  rangeEnd: Date;
  settings: BookingSettings;
  rules: AvailabilityRule[];
  blackouts: Blackout[];
  services: ServiceLike[];
  slotIntervalMin?: number; // default 30
};

export type Slot = { start: Date; end: Date };

function intersects(aStart: Date, aEnd: Date, bStart: Date, bEnd: Date) {
  return isBefore(aStart, bEnd) && isAfter(aEnd, bStart);
}

export function computeTotalDuration(services: ServiceLike[], defaultBufferMin: number) {
  const sum = services.reduce((acc, s) => acc + s.durationMin + s.bufferBeforeMin + s.bufferAfterMin, 0);
  return sum + defaultBufferMin;
}

export function generateSlots(req: SlotRequest): Slot[] {
  const interval = req.slotIntervalMin ?? 30;
  const totalMin = computeTotalDuration(req.services, req.settings.defaultBufferMin);
  const now = new Date();
  const leadReady = addMinutes(now, req.settings.leadTimeMin);
  const slots: Slot[] = [];

  // Iterate by days across the requested range (in UTC), but compute day windows in the admin/rule time zone
  let cursor = startOfUTCDay(req.rangeStart);
  const until = endOfUTCDay(req.rangeEnd);

  while (!isAfter(cursor, until)) {
    const tz = req.settings.timeZone;
    const dayStartUTC = tzStartOfDayUTC(cursor, tz);

    // Determine local day-of-week in the admin time zone for this day
    const dow = new Intl.DateTimeFormat('en-US', { timeZone: tz, weekday: 'short' })
      .format(dayStartUTC); // 'Sun','Mon',...
    const dowIndex = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].indexOf(dow);

    const dayRules = req.rules.filter((r) => r.active && r.dayOfWeek === dowIndex);
    for (const r of dayRules) {
      const ruleTz = r.timeZone || tz;
      const localMidnightUTC = tzStartOfDayUTC(cursor, ruleTz);
      const ruleStart = addMinutes(localMidnightUTC, r.startMinutes);
      const ruleEnd = addMinutes(localMidnightUTC, r.endMinutes);

      // walk in interval steps
      for (let t = ruleStart; !isAfter(addMinutes(t, totalMin), ruleEnd); t = addMinutes(t, interval)) {
        const sStart = t;
        const sEnd = addMinutes(t, totalMin);

        // enforce lead time and max advance (both measured in real UTC time)
        if (isBefore(sStart, leadReady)) continue;
        const maxAdvanceEnd = addMinutes(now, req.settings.maxAdvanceDays * 24 * 60);
        if (isAfter(sStart, maxAdvanceEnd)) continue;

        // check blackouts (stored as UTC instants)
        const blocked = req.blackouts.some((b) => intersects(sStart, sEnd, b.start, b.end));
        if (blocked) continue;

        slots.push({ start: sStart, end: sEnd });
      }
    }

    // Move to next UTC day
    cursor = addMinutes(startOfUTCDay(addMinutes(cursor, 24 * 60)), 0);
  }

  return slots;
}

