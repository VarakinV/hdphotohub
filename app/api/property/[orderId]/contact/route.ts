import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional().nullable(),
  message: z.string().min(1).max(5000),
});

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.warn('RESEND_API_KEY not set; skipping email send');
    return { ok: false } as const;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      from: 'Media Portal <no-reply@media-portal.local>',
      to: [to],
      subject,
      html,
    }),
  });
  return { ok: res.ok as boolean } as const;
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ orderId: string }> }) {
  try {
    const { orderId } = await params;
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });

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
      await sendEmail({ to: order.realtor.email, subject, html });
    }

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

