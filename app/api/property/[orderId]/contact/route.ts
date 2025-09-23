import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Resend } from 'resend';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  message: z.string().min(1).max(5000),
  recaptchaToken: z.string().optional().nullable(),
});

async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Photos 4 Real Estate <onboarding@resend.dev>';
  if (!apiKey) {
    console.warn('[PROPERTY CONTACT] RESEND_API_KEY not set; logging instead.');
    console.log('[PROPERTY CONTACT EMAIL]', { to, subject });
    return { ok: false as const, skipped: true as const };
  }
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      replyTo: replyTo,
    });
    if (error) {
      console.error('[PROPERTY CONTACT] Resend error', error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (err) {
    console.error('[PROPERTY CONTACT] Resend send failed', err);
    return { ok: false as const, error: (err as Error).message };
  }
}

async function verifyRecaptcha(token?: string | null, remoteIp?: string | null) {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true as const, skipped: true as const };
  if (!token) return { ok: false as const, reason: 'missing' };
  try {
    const params = new URLSearchParams({ secret, response: token });
    if (remoteIp) params.set('remoteip', remoteIp);
    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });
    const json: any = await resp.json();
    const ok = json.success === true && (json.score == null || json.score >= 0.5);
    return { ok, score: json.score, action: json.action, errors: json['error-codes'] };
  } catch (e) {
    console.warn('[PROPERTY CONTACT] reCAPTCHA verify failed', e);
    return { ok: false as const, reason: 'exception' };
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

    // Verify reCAPTCHA (if configured)
    const ip = req.headers.get('x-forwarded-for');
    const recaptcha = await verifyRecaptcha(parsed.data.recaptchaToken, ip);
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    // Load order + realtor to get recipient
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { realtor: true },
    });
    if (!order) return NextResponse.json({ error: 'Order not found' }, { status: 404 });

    // Store inquiry
    await prisma.propertyInquiry.create({
      data: {
        orderId: order.id,
        name: parsed.data.name.trim(),
        email: parsed.data.email.trim(),
        phone: parsed.data.phone?.trim() || null,
        message: parsed.data.message.trim(),
      },
    });

    // Send email to realtor
    const subject = `New inquiry for ${order.propertyFormattedAddress || order.propertyAddress}`;
    const html = `
      <div>
        <p>You have a new inquiry on ${order.propertyFormattedAddress || order.propertyAddress}.</p>
        <p><strong>Name:</strong> ${parsed.data.name}</p>
        <p><strong>Email:</strong> ${parsed.data.email}</p>
        ${parsed.data.phone ? `<p><strong>Phone:</strong> ${parsed.data.phone}</p>` : ''}
        <p><strong>Message:</strong></p>
        <p>${escapeHtml(parsed.data.message).replace(/\n/g, '<br/>')}</p>
      </div>
    `;
    if (order.realtor.email) {
      await sendEmail({ to: order.realtor.email, subject, html, replyTo: parsed.data.email });
    }

    // Confirmation email to inquirer
    const confSubject = `We received your inquiry: ${order.propertyFormattedAddress || order.propertyAddress}`;
    const confHtml = `
      <div>
        <p>Thanks for reaching out about <strong>${order.propertyFormattedAddress || order.propertyAddress}</strong>.</p>
        <p>Your message has been delivered to ${order.realtor.firstName} ${order.realtor.lastName}${order.realtor.email ? ` (${order.realtor.email})` : ''}.</p>
        ${order.realtor.phone ? `<p>Phone: ${order.realtor.phone}</p>` : ''}
        <p>We will get back to you shortly.</p>
        <hr/>
        <p><em>Your message:</em></p>
        <p>${escapeHtml(parsed.data.message).replace(/\n/g, '<br/>')}</p>
      </div>
    `;
    await sendEmail({ to: parsed.data.email, subject: confSubject, html: confHtml, replyTo: order.realtor.email || undefined });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to submit inquiry' }, { status: 500 });
  }
}

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

