import { google } from "googleapis";
import { prisma } from "@/lib/db/prisma";

export async function getGoogleClientForAdmin(adminId: string) {
  const account = await prisma.account.findFirst({
    where: { userId: adminId, provider: "google" },
  });
  if (!account?.access_token) return null;

  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    console.warn("[Google] Missing AUTH_GOOGLE_ID/SECRET envs");
    return null;
  }

  const oAuth2 = new google.auth.OAuth2(clientId, clientSecret);
  oAuth2.setCredentials({
    access_token: account.access_token || undefined,
    refresh_token: account.refresh_token || undefined,
    expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
    scope: account.scope || undefined,
    token_type: (account.token_type as any) || undefined,
    id_token: account.id_token || undefined,
  });

  // Force an access token to be present (triggers refresh if needed)
  try {
    const tokenResp = await oAuth2.getAccessToken();
    const token = typeof tokenResp === 'string' ? tokenResp : tokenResp?.token;
    if (!token) {
      console.warn('[Google] getAccessToken returned empty token');
      return null;
    }
    // Ensure the fetched token is active on the client
    oAuth2.setCredentials({
      access_token: token,
      refresh_token: account.refresh_token || undefined,
      expiry_date: account.expires_at ? account.expires_at * 1000 : undefined,
      scope: account.scope || undefined,
      token_type: 'Bearer',
      id_token: account.id_token || undefined,
    });
    // Set as global default auth for googleapis
    try { google.options({ auth: oAuth2 }); } catch {}
  } catch (e) {
    console.warn('[Google] Failed to obtain access token', e);
    return null;
  }

  // Persist refreshed tokens back to Account
  oAuth2.on("tokens", async (tokens) => {
    try {
      await prisma.account.updateMany({
        where: { userId: adminId, provider: "google" },
        data: {
          access_token: tokens.access_token ?? undefined,
          refresh_token: tokens.refresh_token ?? undefined,
          expires_at: tokens.expiry_date ? Math.floor(tokens.expiry_date / 1000) : undefined,
          scope: tokens.scope ?? undefined,
          token_type: tokens.token_type ?? undefined,
          id_token: tokens.id_token ?? undefined,
        },
      });
    } catch (e) {
      console.warn("[Google] Failed to persist refreshed tokens", e);
    }
  });

  return oAuth2;
}

export async function listCalendars(adminId: string) {
  const auth = await getGoogleClientForAdmin(adminId);
  if (!auth) return null;

  // Use global google.options auth
  const cal = google.calendar({ version: "v3" });
  const res = await cal.calendarList.list();
  return res.data.items || [];
}

export async function getFreeBusy(adminId: string, calendarId: string | null, timeMin: string, timeMax: string, timeZone?: string) {
  const auth = await getGoogleClientForAdmin(adminId);
  if (!auth) {
    console.warn('[FreeBusy] Google auth failed for admin', adminId, '— returning empty busy list');
    return [] as { start: string; end: string }[];
  }
  const cal = google.calendar({ version: "v3", auth });

  // Always query "primary" calendar (where phone-created events land).
  // If a different calendar is configured, query that too so we catch
  // busy times from both calendars.
  const ids = new Set<string>(["primary"]);
  if (calendarId) ids.add(calendarId);

  console.log('[FreeBusy] Querying calendars:', Array.from(ids), 'range:', timeMin, '->', timeMax);

  const res = await cal.freebusy.query({
    requestBody: {
      timeMin,
      timeMax,
      timeZone,
      items: Array.from(ids).map((id) => ({ id })),
    },
  });

  // Merge busy periods from all queried calendars
  const calendars = (res.data.calendars ?? {}) as Record<string, { busy?: { start: string; end: string }[]; errors?: any[] }>;
  const allBusy: { start: string; end: string }[] = [];
  for (const id of ids) {
    const entry = calendars[id];
    // Log per-calendar errors (e.g. notFound, auth issues)
    if (entry?.errors?.length) {
      console.warn('[FreeBusy] Calendar', id, 'returned errors:', JSON.stringify(entry.errors));
    }
    const periods = entry?.busy;
    if (Array.isArray(periods)) {
      console.log('[FreeBusy] Calendar', id, 'has', periods.length, 'busy periods');
      allBusy.push(...periods);
    } else {
      console.warn('[FreeBusy] Calendar', id, 'returned no busy array');
    }
  }
  console.log('[FreeBusy] Total busy periods:', allBusy.length);
  return allBusy;
}

export type CreateEventInput = {
  calendarId?: string | null;
  summary: string;
  description?: string;
  startISO: string;
  endISO: string;
  timeZone?: string;
  attendees?: { email: string; displayName?: string }[];
  location?: string;
};

export async function createEventForAdmin(adminId: string, input: CreateEventInput) {
  const auth = await getGoogleClientForAdmin(adminId);
  if (!auth) return null;
  google.options({ auth });
  const cal = google.calendar({ version: "v3" });
  const calendarId = input.calendarId || "primary";
  const res = await cal.events.insert({
    calendarId,
    requestBody: {
      summary: input.summary,
      description: input.description,
      start: { dateTime: input.startISO, timeZone: input.timeZone },
      end: { dateTime: input.endISO, timeZone: input.timeZone },
      attendees: input.attendees,
      location: input.location,
    },
    sendUpdates: "all",
  });
  return res.data;
}

export type UpdateEventInput = {
  calendarId?: string | null;
  eventId: string;
  summary?: string;
  description?: string;
  startISO?: string;
  endISO?: string;
  timeZone?: string;
  attendees?: { email: string; displayName?: string }[];
  location?: string;
};

export async function updateEventForAdmin(adminId: string, input: UpdateEventInput) {
  const auth = await getGoogleClientForAdmin(adminId);
  if (!auth) return null;
  google.options({ auth });
  const cal = google.calendar({ version: "v3" });
  const calendarId = input.calendarId || "primary";
  const res = await cal.events.patch({
    calendarId,
    eventId: input.eventId,
    requestBody: {
      summary: input.summary || undefined,
      description: input.description || undefined,
      start: input.startISO ? { dateTime: input.startISO, timeZone: input.timeZone } : undefined,
      end: input.endISO ? { dateTime: input.endISO, timeZone: input.timeZone } : undefined,
      attendees: input.attendees || undefined,
      location: input.location || undefined,
    },
  });
  return res.data;
}

export async function deleteEventForAdmin(adminId: string, calendarId: string | null | undefined, eventId: string) {
  const auth = await getGoogleClientForAdmin(adminId);
  if (!auth) return null;
  google.options({ auth });
  const cal = google.calendar({ version: "v3" });
  const calId = calendarId || "primary";
  await cal.events.delete({ calendarId: calId, eventId });
  return true;
}

export async function getEventForAdmin(adminId: string, calendarId: string | null | undefined, eventId: string) {
  const auth = await getGoogleClientForAdmin(adminId);
  if (!auth) return null;
  google.options({ auth });
  const cal = google.calendar({ version: "v3" });
  const calId = calendarId || "primary";
  const res = await cal.events.get({ calendarId: calId, eventId });
  return res.data;
}

