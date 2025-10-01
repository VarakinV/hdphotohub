/*
  Go High Level (LeadConnector) integration helpers
  - Upsert contact
  - Add tags to contact

  Env vars required:
    - GHL_API_KEY: personal access token (Bearer ...)
    - GHL_LOCATION_ID: target locationId for contacts
    - GHL_API_VERSION: default "2021-07-28"
    - GHL_API_BASE: default "https://services.leadconnectorhq.com"
*/

export type GhlCustomField = { key: string; field_value: string };

export interface GhlUpsertContactInput {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string | null;
  locationId: string;
  customFields?: GhlCustomField[];
}

interface GhlUpsertResponse {
  new: boolean;
  succeded: boolean; // note spelling in their response
  contact?: { id: string };
}

function getEnv(name: string, fallback?: string) {
  const v = process.env[name] ?? fallback;
  return typeof v === 'string' && v.trim().length > 0 ? v : undefined;
}

function getBaseHeaders() {
  const token = getEnv('GHL_API_KEY');
  const version = getEnv('GHL_API_VERSION', '2021-07-28');
  if (!token) throw new Error('[GHL] GHL_API_KEY is not configured');
  return {
    Authorization: `Bearer ${token}`,
    Version: version!,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as const;
}

function getBaseUrl() {
  return getEnv('GHL_API_BASE', 'https://services.leadconnectorhq.com')!;
}

export async function upsertContact(input: GhlUpsertContactInput): Promise<string | null> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/contacts/upsert`, {
    method: 'POST',
    headers: getBaseHeaders(),
    body: JSON.stringify({
      firstName: input.firstName,
      lastName: input.lastName,
      email: input.email,
      locationId: input.locationId,
      ...(input.phone ? { phone: input.phone } : {}),
      ...(input.customFields && input.customFields.length > 0
        ? { customFields: input.customFields }
        : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[GHL] Upsert contact failed', res.status, text);
    return null;
  }
  const data = (await res.json().catch(() => ({}))) as GhlUpsertResponse;
  const id = data?.contact?.id ?? null;
  if (!id) console.warn('[GHL] Upsert succeeded but no contact id in response');
  return id;
}

export async function addTags(contactId: string, tags: string[]): Promise<boolean> {
  const base = getBaseUrl();
  const res = await fetch(`${base}/contacts/${encodeURIComponent(contactId)}/tags`, {
    method: 'POST',
    headers: getBaseHeaders(),
    body: JSON.stringify({ tags }),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[GHL] Add tags failed', res.status, text);
    return false;
  }
  return true;
}

// Appointment creation (Calendars)
function getAppointmentsHeaders() {
  const token = getEnv('GHL_API_KEY');
  const version = getEnv('GHL_APPOINTMENTS_API_VERSION', '2021-04-15');
  if (!token) throw new Error('[GHL] GHL_API_KEY is not configured');
  return {
    Authorization: `Bearer ${token}`,
    Version: version!,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  } as const;
}

export async function createAppointment(params: {
  title: string;
  description?: string;
  address: string;
  calendarId: string;
  locationId: string;
  contactId: string;
  startTimeISO: string;
  assignedUserId?: string;
}): Promise<boolean> {
  const base = getBaseUrl();
  const body = {
    title: params.title,
    meetingLocationType: 'custom',
    meetingLocationId: 'custom_0',
    overrideLocationConfig: true,
    appointmentStatus: 'confirmed',
    assignedUserId: params.assignedUserId,
    description: params.description ? `${params.description} - ${params.address}` : `${params.title} - ${params.address}`,
    address: params.address,
    ignoreDateRange: false,
    toNotify: false,
    ignoreFreeSlotValidation: true,
    calendarId: params.calendarId,
    locationId: params.locationId,
    contactId: params.contactId,
    startTime: params.startTimeISO,
  } as Record<string, any>;
  if (!body.assignedUserId) delete body.assignedUserId; // optional

  const res = await fetch(`${base}/calendars/events/appointments`, {
    method: 'POST',
    headers: getAppointmentsHeaders(),
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    console.warn('[GHL] Create appointment failed', res.status, text);
    return false;
  }
  return true;
}


// Orchestrate end-to-end booking push
export async function sendBookingToGhl(params: {
  contactFirstName: string;
  contactLastName: string;
  contactEmail: string;
  contactPhone?: string | null;
  address: string;
  startISO: string; // booking start in ISO
  timeZone?: string | null; // for local date/time formatting
  city?: string | null; // to build a city-specific tag when available
}): Promise<void> {
  try {
    const locationId = getEnv('GHL_LOCATION_ID');
    if (!locationId) {
      console.log('[GHL] Skipped: GHL_LOCATION_ID is not set');
      return;
    }

    const dt = new Date(params.startISO);
    const tz = params.timeZone || 'UTC';
    // Date: YYYY-MM-DD (Date Picker field)
    const dateStr = dt.toLocaleDateString('en-CA', { timeZone: tz });
    // Time: 1:00 PM (12h)
    const timeStr = dt.toLocaleString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: tz,
    });

    const customFields: GhlCustomField[] = [
      { key: 'booking_address', field_value: params.address },
      { key: 'booking_date_and_time', field_value: dateStr },
      { key: 'booking_time', field_value: timeStr },
    ];

    const contactId = await upsertContact({
      firstName: params.contactFirstName,
      lastName: params.contactLastName,
      email: params.contactEmail,
      phone: params.contactPhone || undefined,
      locationId,
      customFields,
    });

    if (!contactId) return; // already logged

    // Create appointment for the contact
    try {
      const calendarId = getEnv('GHL_CALENDAR_ID');
      const assignedUserId = getEnv('GHL_ASSIGNED_USER_ID');
      if (!calendarId) {
        console.log('[GHL] Skipped appointment: GHL_CALENDAR_ID not set');
      } else {
        await createAppointment({
          title: 'Photoshoot',
          description: 'Photoshoot',
          address: params.address,
          calendarId,
          locationId,
          contactId,
          startTimeISO: params.startISO,
          assignedUserId,
        });
      }
    } catch (e) {
      console.warn('[GHL] Appointment creation failed; continuing', e);
    }

    // Build tags: hardcoded per requirement
    const tags = [
      "realtor",
      "realtor calgary",
      " new booking request ",
    ];

    await addTags(contactId, tags);
  } catch (e) {
    console.warn('[GHL] sendBookingToGhl failed; continuing', e);
  }
}

