import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';
import { Resend } from 'resend';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';

const schema = z.object({
  assignmentId: z.string(),
  name: z.string().min(1).max(100),
  email: z.string().email().nullable().optional(),
  phone: z.string().max(20).nullable().optional(),
  recaptchaToken: z.string().optional().nullable(),
  honeypot: z.string().optional(),
});

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 5;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return true;
  }

  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }

  entry.count++;
  return true;
}

async function sendEmail({ to, subject, html, replyTo }: { to: string; subject: string; html: string; replyTo?: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Photos 4 Real Estate <onboarding@resend.dev>';
  if (!apiKey) {
    console.warn('[QR LEAD] RESEND_API_KEY not set; logging instead.');
    console.log('[QR LEAD EMAIL]', { to, subject });
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
      console.error('[QR LEAD] Resend error', error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (err) {
    console.error('[QR LEAD] Resend send failed', err);
    return { ok: false as const, error: (err as Error).message };
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

export async function POST(request: NextRequest) {
  try {
    const ip = request.headers.get('x-forwarded-for') || 'unknown';

    if (!checkRateLimit(ip)) {
      return NextResponse.json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
    }

    const body = await request.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
    }

    if (parsed.data.honeypot) {
      return NextResponse.json({ ok: true });
    }

    if (!parsed.data.email && !parsed.data.phone) {
      return NextResponse.json({ error: 'Please provide either email or phone' }, { status: 400 });
    }

    const recaptcha = await verifyRecaptchaServer(parsed.data.recaptchaToken, 'qr_lead_submit');
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    const assignment = await prisma.qRAssignment.findUnique({
      where: { id: parsed.data.assignmentId },
      include: {
        order: {
          include: {
            realtor: true,
          },
        },
      },
    });

    if (!assignment || assignment.unassignedAt !== null) {
      return NextResponse.json({ error: 'Invalid assignment' }, { status: 404 });
    }

    await prisma.propertyInquiry.create({
      data: {
        orderId: assignment.orderId,
        name: parsed.data.name.trim(),
        email: parsed.data.email?.trim() || '',
        phone: parsed.data.phone?.trim() || null,
        message: null,
        source: 'QR_CODE',
        qrAssignmentId: assignment.id,
      },
    });

    const order = assignment.order;
    const subject = `New QR Code Lead: ${order.propertyFormattedAddress || order.propertyAddress}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #ca4153;">New Lead from QR Code</h2>
        <p><strong>Property:</strong> ${escapeHtml(order.propertyFormattedAddress || order.propertyAddress)}</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <h3>Contact Information</h3>
        <p><strong>Name:</strong> ${escapeHtml(parsed.data.name)}</p>
        ${parsed.data.email ? `<p><strong>Email:</strong> ${escapeHtml(parsed.data.email)}</p>` : ''}
        ${parsed.data.phone ? `<p><strong>Phone:</strong> ${escapeHtml(parsed.data.phone)}</p>` : ''}
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #666; font-size: 12px;">
          This lead was captured via QR code scan on ${new Date().toLocaleString()}.
        </p>
      </div>
    `;

    if (order.realtor.email) {
      await sendEmail({
        to: order.realtor.email,
        subject,
        html,
        replyTo: parsed.data.email || undefined,
      });
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('[QR LEAD]', e);
    return NextResponse.json({ error: 'Failed to submit lead' }, { status: 500 });
  }
}
