function addMinutes(d: Date, m: number) { return new Date(d.getTime() + m * 60000); }
function startOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0); }
function endOfDay(d: Date) { return new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999); }
function isBefore(a: Date, b: Date) { return a.getTime() < b.getTime(); }
function isAfter(a: Date, b: Date) { return a.getTime() > b.getTime(); }

export type BookingSettings = {
  timeZone: string;
  leadTimeMin: number;
  maxAdvanceDays: number;
  defaultBufferMin: number;
};

export type AvailabilityRule = {
  dayOfWeek: number; // 0-6
  startMinutes: number; // since midnight
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

  let d = startOfDay(req.rangeStart);
  while (!isAfter(d, endOfDay(req.rangeEnd))) {
    const dow = d.getDay();
    const dayRules = req.rules.filter((r) => r.active && r.dayOfWeek === dow);
    for (const r of dayRules) {
      // window for this rule on day d
      const ruleStart = addMinutes(startOfDay(d), r.startMinutes);
      const ruleEnd = addMinutes(startOfDay(d), r.endMinutes);

      // walk in interval steps
      for (let t = ruleStart; !isAfter(addMinutes(t, totalMin), ruleEnd); t = addMinutes(t, interval)) {
        const sStart = t;
        const sEnd = addMinutes(t, totalMin);

        // enforce lead time and max advance
        if (isBefore(sStart, leadReady)) continue;
        const maxAdvanceEnd = addMinutes(now, req.settings.maxAdvanceDays * 24 * 60);
        if (isAfter(sStart, maxAdvanceEnd)) continue;

        // check blackouts
        const blocked = req.blackouts.some((b) => intersects(sStart, sEnd, b.start, b.end));
        if (blocked) continue;

        slots.push({ start: sStart, end: sEnd });
      }
    }
    d = addMinutes(startOfDay(addMinutes(d, 24 * 60)), 0);
  }

  return slots;
}

