import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { prisma } from '@/lib/db/prisma';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';

const schema = z.object({
  appointmentType: z.enum(['In Person', 'Virtual Showing']),
  preferredDate: z.string().regex(/^[0-9]{4}-[0-9]{2}-[0-9]{2}$/),
  preferredTime: z.enum(['Morning', 'Afternoon', 'Evening']),
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().min(1).max(40),
  message: z.string().trim().max(5000).optional().nullable(),
  recaptchaToken: z.string().optional().nullable(),
});

async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  from,
}: {
  to: string;
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const senderFrom = from || process.env.RESEND_FROM || 'Photos 4 Real Estate <onboarding@resend.dev>';
  if (!apiKey) {
    console.warn('[BOOK SHOWING] RESEND_API_KEY not set; logging instead.');
    console.log('[BOOK SHOWING EMAIL]', { to, subject });
    return { ok: false as const, skipped: true as const };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from: senderFrom, to, subject, html, replyTo });
    if (error) {
      console.error('[BOOK SHOWING] Resend error', error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (error) {
    console.error('[BOOK SHOWING] Resend send failed', error);
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

    const recaptcha = await verifyRecaptchaServer(parsed.data.recaptchaToken, 'property_book_showing');
    if (!recaptcha.ok) return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { realtor: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const address = order.propertyFormattedAddress || order.propertyAddress || 'this property';
    const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`.trim();
    const fullName = `${parsed.data.firstName} ${parsed.data.lastName}`.trim();
    const dateLabel = formatDate(parsed.data.preferredDate);
    const appointmentTypeLabel = parsed.data.appointmentType;
    const message = parsed.data.message?.trim() || '';
    const inquiryMessage = [
      'Book a Private Showing',
      `Appointment Type: ${appointmentTypeLabel}`,
      `Preferred Date: ${dateLabel}`,
      `Preferred Time: ${parsed.data.preferredTime}`,
      message ? `Message: ${message}` : null,
    ].filter(Boolean).join('\n');

    await prisma.propertyInquiry.create({
      data: {
        orderId: order.id,
        name: fullName,
        email: parsed.data.email,
        phone: parsed.data.phone,
        message: inquiryMessage,
      },
    });

    if (order.realtor.email) {
      await sendEmail({
        to: order.realtor.email,
        subject: `Showing request for ${address}`,
        replyTo: parsed.data.email,
        html: `
          <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
            <h2>New private showing request</h2>
            <p>A visitor requested a showing for <strong>${escapeHtml(address)}</strong>.</p>
            <p><strong>Appointment Type:</strong> ${escapeHtml(appointmentTypeLabel)}</p>
            <p><strong>Preferred Date:</strong> ${escapeHtml(dateLabel)}</p>
            <p><strong>Preferred Time:</strong> ${escapeHtml(parsed.data.preferredTime)}</p>
            <hr />
            <p><strong>Name:</strong> ${escapeHtml(fullName)}</p>
            <p><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>
            <p><strong>Phone:</strong> ${escapeHtml(parsed.data.phone)}</p>
            ${message ? `<p><strong>Message:</strong><br/>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>` : ''}
          </div>
        `,
      });
    }

    await sendEmail({
      to: parsed.data.email,
      from: getRealtorFromHeader(realtorName),
      subject: `We received your showing request`,
      replyTo: order.realtor.email || undefined,
      html: `
        <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
          <p>Thanks for requesting a private showing for <strong>${escapeHtml(address)}</strong>.</p>
          <p>We received your request for <strong>${escapeHtml(dateLabel)}</strong> in the <strong>${escapeHtml(parsed.data.preferredTime.toLowerCase())}</strong>.</p>
          <p>${escapeHtml(realtorName || 'The realtor')} will get back to you shortly to confirm availability.</p>
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
    console.error('[BOOK SHOWING] Failed to submit showing request', error);
    return NextResponse.json({ error: 'Failed to submit showing request' }, { status: 500 });
  }
}

function formatDate(value: string) {
  const [year, month, day] = value.split('-').map(Number);
  return new Intl.DateTimeFormat('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  }).format(new Date(year, month - 1, day));
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