import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { prisma } from '@/lib/db/prisma';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
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
    console.warn('[SIMILAR HOMES LEAD] RESEND_API_KEY not set; logging instead.');
    console.log('[SIMILAR HOMES LEAD EMAIL]', { to, subject });
    return { ok: false as const, skipped: true as const };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({ from: senderFrom, to, subject, html, replyTo });
    if (error) {
      console.error('[SIMILAR HOMES LEAD] Resend error', error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (error) {
    console.error('[SIMILAR HOMES LEAD] Resend send failed', error);
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

    const recaptcha = await verifyRecaptchaServer(parsed.data.recaptchaToken, 'property_similar_homes');
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId }, include: { realtor: true } });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    const address = order.propertyFormattedAddress || order.propertyAddress;
    const priceLabel = order.listPrice ? `$${order.listPrice.toLocaleString()}` : null;
    const area = order.propertyCity?.trim() || 'this area';
    const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`.trim();
    const phone = parsed.data.phone?.trim() || null;
    const requestSummary = priceLabel
      ? `Looking for similar homes under ${priceLabel} in ${area}.`
      : `Looking for similar homes in ${area}.`;

    await prisma.propertyInquiry.create({
      data: {
        orderId: order.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone,
        message: `Similar Homes Lead\n${requestSummary}`,
      },
    });

    if (order.realtor.email) {
      await sendEmail({
        to: order.realtor.email,
        subject: `Similar homes lead for ${address}`,
        replyTo: parsed.data.email,
        html: `
          <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
            <h2>New similar homes request</h2>
            <p>A visitor requested similar homes from the property website for <strong>${escapeHtml(address)}</strong>.</p>
            <p><strong>Request:</strong> ${escapeHtml(requestSummary)}</p>
            <p><strong>Name:</strong> ${escapeHtml(parsed.data.name)}</p>
            <p><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>
            ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
          </div>
        `,
      });
    }

    await sendEmail({
      to: parsed.data.email,
      from: getRealtorFromHeader(realtorName),
      subject: `We received your similar homes request`,
      replyTo: order.realtor.email || undefined,
      html: `
        <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
          <p>Thanks for your interest in homes near <strong>${escapeHtml(address)}</strong>.</p>
          <p>We received your request: ${escapeHtml(requestSummary)}</p>
          <p>${escapeHtml(realtorName || 'The realtor')} will get back to you shortly.</p>
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
    console.error('[SIMILAR HOMES LEAD] Failed to submit lead', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
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