import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { prisma } from '@/lib/db/prisma';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';

const schema = z.object({
  address: z.string().trim().max(300).optional().nullable(),
  formattedAddress: z.string().trim().max(300).optional().nullable(),
  lat: z.number().nullable().optional(),
  lng: z.number().nullable().optional(),
  city: z.string().trim().max(120).optional().nullable(),
  province: z.string().trim().max(120).optional().nullable(),
  postalCode: z.string().trim().max(40).optional().nullable(),
  country: z.string().trim().max(120).optional().nullable(),
  placeId: z.string().trim().max(200).optional().nullable(),
  propertyType: z.enum(['Detached', 'Semi-detached', 'Townhouse', 'Condo/Apartment']).or(z.literal('')).optional(),
  squareFeet: z.string().trim().max(40).optional().nullable(),
  yearBuilt: z.string().trim().max(40).optional().nullable(),
  beds: z.string().trim().max(20).optional().nullable(),
  baths: z.string().trim().max(20).optional().nullable(),
  basementFinished: z.enum(['Yes', 'No']).or(z.literal('')).optional(),
  garage: z.enum(['No', 'Attached', 'Detached']).or(z.literal('')).optional(),
  undergroundParking: z.enum(['Yes', 'No']).or(z.literal('')).optional(),
  garageSize: z.enum(['Single car', 'Double car', 'Oversized']).or(z.literal('')).optional(),
  renovations: z.array(z.string().max(80)).default([]),
  otherRenovation: z.string().trim().max(200).optional().nullable(),
  condition: z.enum(['Original/dated', 'Move-in ready', 'Fully renovated']).or(z.literal('')).optional(),
  outdoorSpace: z.array(z.string().max(80)).default([]),
  additionalNotes: z.string().trim().max(5000).optional().nullable(),
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  preferredContact: z.enum(['Email', 'Phone', 'Text']),
  sellingTimeline: z.enum(['Just curious', '3–6 months', '6–12 months', 'Ready now']),
  spokenToRealtor: z.enum(['Yes', 'No', 'Interviewing agents']),
  recaptchaToken: z.string().optional().nullable(),
}).superRefine((data, ctx) => {
  if ((data.preferredContact === 'Phone' || data.preferredContact === 'Text') && !data.phone?.trim()) {
    ctx.addIssue({ code: 'custom', path: ['phone'], message: 'Phone is required for phone or text follow-up.' });
  }
});

async function sendEmail({ to, subject, html, replyTo, from }: { to: string; subject: string; html: string; replyTo?: string; from?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const senderFrom = from || process.env.RESEND_FROM || 'Photos 4 Real Estate <onboarding@resend.dev>';
  if (!apiKey) {
    console.warn('[HOME WORTH] RESEND_API_KEY not set; logging instead.');
    console.log('[HOME WORTH EMAIL]', { to, subject });
    return { ok: false as const, skipped: true as const };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from: senderFrom, to, subject, html, replyTo });
    if (error) {
      console.error('[HOME WORTH] Resend error', error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (error) {
    console.error('[HOME WORTH] Resend send failed', error);
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

    const recaptcha = await verifyRecaptchaServer(parsed.data.recaptchaToken, 'property_home_worth');
    if (!recaptcha.ok) return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { realtor: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const data = parsed.data;
    const sourceAddress = order.propertyFormattedAddress || order.propertyAddress || 'property website';
    const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`.trim();
    const summary = buildSummary(data);

    await prisma.propertyInquiry.create({
      data: {
        orderId: order.id,
        name: data.name,
        email: data.email,
        phone: data.phone?.trim() || null,
        message: `What's My Home Worth?\n${summary}`,
      },
    });

    if (order.realtor.email) {
      await sendEmail({
        to: order.realtor.email,
        subject: `Home value lead from ${sourceAddress}`,
        replyTo: data.email,
        html: `
          <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
            <h2>New “What&apos;s My Home Worth?” lead</h2>
            <p>A visitor requested a home value report from the property website for <strong>${escapeHtml(sourceAddress)}</strong>.</p>
            ${summaryToHtml(summary)}
          </div>
        `,
      });
    }

    await sendEmail({
      to: data.email,
      from: getRealtorFromHeader(realtorName),
      subject: 'We received your home value request',
      replyTo: order.realtor.email || undefined,
      html: `
        <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
          <h2>Thank you!</h2>
          <p>Your report is being prepared.</p>
          <p>We received your request${data.address ? ` for <strong>${escapeHtml(data.address)}</strong>` : ''}. ${escapeHtml(realtorName || 'The realtor')} will review the information and follow up shortly.</p>
          <hr />
          <p><strong>Realtor contact information</strong></p>
          <p>${escapeHtml(realtorName || 'Realtor')}</p>
          ${order.realtor.companyName ? `<p>${escapeHtml(order.realtor.companyName)}</p>` : ''}
          ${order.realtor.email ? `<p>Email: ${escapeHtml(order.realtor.email)}</p>` : ''}
          ${order.realtor.phone ? `<p>Phone: ${escapeHtml(order.realtor.phone)}</p>` : ''}
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[HOME WORTH] Failed to submit request', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

function buildSummary(data: z.infer<typeof schema>) {
  const lines = [
    data.address ? `Address: ${data.address}` : 'Address: Not provided',
    data.formattedAddress ? `Formatted address: ${data.formattedAddress}` : null,
    data.city ? `City: ${data.city}` : null,
    data.province ? `Province/State: ${data.province}` : null,
    data.postalCode ? `Postal code: ${data.postalCode}` : null,
    data.propertyType ? `Property type: ${data.propertyType}` : 'Property type: Not provided',
    data.squareFeet ? `Approx sq ft: ${data.squareFeet}` : null,
    data.yearBuilt ? `Year built: ${data.yearBuilt}` : null,
    data.beds ? `Beds: ${data.beds}` : null,
    data.baths ? `Baths: ${data.baths}` : null,
    data.propertyType === 'Condo/Apartment' ? `Underground parking: ${data.undergroundParking || 'Not provided'}` : `Basement finished: ${data.basementFinished || 'Not provided'}`,
    data.propertyType !== 'Condo/Apartment' ? `Garage: ${data.garage || 'Not provided'}` : null,
    data.garageSize ? `Garage size: ${data.garageSize}` : null,
    data.renovations.length ? `Recent renovations: ${data.renovations.join(', ')}${data.otherRenovation ? ` — ${data.otherRenovation}` : ''}` : null,
    data.condition ? `Condition: ${data.condition}` : null,
    data.outdoorSpace.length ? `Outdoor space: ${data.outdoorSpace.join(', ')}` : null,
    data.additionalNotes ? `Additional notes: ${data.additionalNotes}` : null,
    '',
    `Name: ${data.name}`,
    `Email: ${data.email}`,
    data.phone ? `Phone: ${data.phone}` : null,
    `Preferred contact: ${data.preferredContact}`,
    `Selling timeline: ${data.sellingTimeline}`,
    `Spoken to a REALTOR®: ${data.spokenToRealtor}`,
  ];
  return lines.filter((line): line is string => line !== null).join('\n');
}

function summaryToHtml(summary: string) {
  return `<pre style="white-space:pre-wrap;font-family:system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;background:#f7f7f7;padding:16px;border-radius:10px;">${escapeHtml(summary)}</pre>`;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function getRealtorFromHeader(realtorName?: string | null) {
  const fallbackFrom = process.env.RESEND_FROM || 'Photos 4 Real Estate <onboarding@resend.dev>';
  const senderEmail = extractEmailAddress(fallbackFrom);
  const safeName = (realtorName || '').replace(/[<>"\r\n]/g, '').trim();
  return safeName ? `${safeName} <${senderEmail}>` : fallbackFrom;
}

function extractEmailAddress(fromValue: string) {
  const angleMatch = fromValue.match(/<([^>]+)>/);
  return angleMatch?.[1]?.trim() || fromValue.trim();
}