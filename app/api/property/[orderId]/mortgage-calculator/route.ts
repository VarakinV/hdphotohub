import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Resend } from 'resend';
import { prisma } from '@/lib/db/prisma';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';
import {
  MORTGAGE_DISCLAIMER,
  MORTGAGE_TERM_OPTIONS,
  PAYMENT_FREQUENCY_OPTIONS,
  calculateMortgageSummary,
  formatCurrency,
  formatPercent,
} from '@/lib/mortgage';

const schema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(40).optional().nullable(),
  homePrice: z.number().nonnegative(),
  downPaymentAmount: z.number().nonnegative(),
  interestRate: z.number().nonnegative().max(100),
  amortizationYears: z.number().int().min(1).max(30),
  paymentFrequency: z.enum(PAYMENT_FREQUENCY_OPTIONS),
  termYears: z.number().int().refine(
    (value) => MORTGAGE_TERM_OPTIONS.includes(value as (typeof MORTGAGE_TERM_OPTIONS)[number]),
    { message: 'Invalid mortgage term.' }
  ),
  propertyTaxAnnual: z.number().nonnegative().max(1000000),
  monthlyHeatingCosts: z.number().nonnegative().max(1000000),
  monthlyCondoFees: z.number().nonnegative().max(1000000),
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
    console.warn('[MORTGAGE CALCULATOR] RESEND_API_KEY not set; logging instead.');
    console.log('[MORTGAGE CALCULATOR EMAIL]', { to, subject });
    return { ok: false as const, skipped: true as const };
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from: senderFrom,
      to,
      subject,
      html,
      replyTo,
    });

    if (error) {
      console.error('[MORTGAGE CALCULATOR] Resend error', error);
      return { ok: false as const, error: String(error) };
    }

    return { ok: true as const, id: data?.id };
  } catch (error) {
    console.error('[MORTGAGE CALCULATOR] Resend send failed', error);
    return { ok: false as const, error: (error as Error).message };
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const { orderId } = await params;
    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid fields' }, { status: 400 });
    }

    const recaptcha = await verifyRecaptchaServer(
      parsed.data.recaptchaToken,
      'property_mortgage_calculator'
    );
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA verification failed' }, { status: 400 });
    }

    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { realtor: true },
    });
    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const address = order.propertyFormattedAddress || order.propertyAddress || 'this property';
    const realtorName = `${order.realtor.firstName} ${order.realtor.lastName}`.trim();
    const calculation = calculateMortgageSummary({
      ...parsed.data,
      homePrice: order.listPrice && order.listPrice > 0 ? order.listPrice : parsed.data.homePrice,
      termYears: parsed.data.termYears as 3 | 5 | 7 | 10,
    });

    const summary = buildSummary(parsed.data.name, parsed.data.email, parsed.data.phone, address, calculation);

    await prisma.propertyInquiry.create({
      data: {
        orderId: order.id,
        name: parsed.data.name,
        email: parsed.data.email,
        phone: parsed.data.phone?.trim() || null,
        message: summary,
      },
    });

    if (order.realtor.email) {
      await sendEmail({
        to: order.realtor.email,
        subject: `Mortgage calculator lead for ${address}`,
        replyTo: parsed.data.email,
        html: `
          <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
            <h2>New mortgage calculator lead</h2>
            <p>A visitor used the mortgage calculator for <strong>${escapeHtml(address)}</strong>.</p>
            ${renderTable('Lead Details', [
              ['Name', parsed.data.name],
              ['Email', parsed.data.email],
              ['Phone', parsed.data.phone?.trim() || 'Not provided'],
            ])}
            ${renderCalculationTables(calculation)}
            <p style="margin-top:20px;font-size:12px;color:#555;">${escapeHtml(MORTGAGE_DISCLAIMER)}</p>
          </div>
        `,
      });
    }

    await sendEmail({
      to: parsed.data.email,
      from: getRealtorFromHeader(realtorName),
      subject: `Your mortgage estimate for ${address}`,
      replyTo: order.realtor.email || undefined,
      html: `
        <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
          <h2>Your mortgage estimate</h2>
          <p>Thanks for using the mortgage calculator for <strong>${escapeHtml(address)}</strong>.</p>
          <p>Your estimated ${escapeHtml(calculation.paymentFrequency.toLowerCase())} payment is <strong>${escapeHtml(formatCurrency(calculation.estimatedPayment))}</strong>.</p>
          ${renderCalculationTables(calculation)}
          <hr />
          <p><strong>Realtor contact information</strong></p>
          <p>${escapeHtml(realtorName || 'Realtor')}</p>
          ${order.realtor.companyName ? `<p>${escapeHtml(order.realtor.companyName)}</p>` : ''}
          ${order.realtor.email ? `<p>Email: ${escapeHtml(order.realtor.email)}</p>` : ''}
          ${order.realtor.phone ? `<p>Phone: ${escapeHtml(order.realtor.phone)}</p>` : ''}
          <p style="margin-top:20px;font-size:12px;color:#555;">${escapeHtml(MORTGAGE_DISCLAIMER)}</p>
        </div>
      `,
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('[MORTGAGE CALCULATOR] Failed to submit request', error);
    return NextResponse.json({ error: 'Failed to submit request' }, { status: 500 });
  }
}

function buildSummary(
  name: string,
  email: string,
  phone: string | null | undefined,
  address: string,
  calculation: ReturnType<typeof calculateMortgageSummary>
) {
  return [
    'Mortgage Calculator Lead',
    `Property: ${address}`,
    '',
    `Name: ${name}`,
    `Email: ${email}`,
    phone?.trim() ? `Phone: ${phone.trim()}` : 'Phone: Not provided',
    '',
    `Home Price: ${formatCurrency(calculation.homePrice)}`,
    `Down Payment (${formatPercent(calculation.downPaymentPercent)}): ${formatCurrency(calculation.downPaymentAmount)}`,
    `CMHC Insurance: ${formatCurrency(calculation.cmhcPremiumAmount)}`,
    `Loan Amount: ${formatCurrency(calculation.totalLoanAmount)}`,
    `Interest Rate: ${formatPercent(calculation.interestRate)}`,
    `Mortgage Term: ${calculation.termYears} Years`,
    `Amortization Period: ${calculation.amortizationYears} Years`,
    `Payment Frequency: ${calculation.paymentFrequency}`,
    `Estimated Payment: ${formatCurrency(calculation.estimatedPayment)}`,
    `Taxes & Fees Per Payment: ${formatCurrency(calculation.taxesAndFeesPerPayment)}`,
    `Total Interest Cost: ${formatCurrency(calculation.totalInterestCost)}`,
    `Total Loan Cost: ${formatCurrency(calculation.totalLoanCost)}`,
    `Principal Paid Over Term: ${formatCurrency(calculation.principalPaidOverTerm)}`,
    `Interest Paid Over Term: ${formatCurrency(calculation.interestPaidOverTerm)}`,
    `Total Paid Over Term: ${formatCurrency(calculation.totalPaidOverTerm)}`,
    `Balance After Term: ${formatCurrency(calculation.balanceAfterTerm)}`,
    '',
    `Disclaimer: ${MORTGAGE_DISCLAIMER}`,
  ].join('\n');
}

function renderCalculationTables(calculation: ReturnType<typeof calculateMortgageSummary>) {
  return [
    renderTable('Payment Summary', [
      ['Estimated Payment', formatCurrency(calculation.estimatedPayment)],
      ['Principal', formatCurrency(calculation.totalLoanAmount)],
      ['Interest', formatCurrency(calculation.totalInterestCost)],
      ['Other Taxes & Fees', formatCurrency(calculation.totalTaxesAndFees)],
    ]),
    renderTable('Mortgage Details', [
      ['Home Price', formatCurrency(calculation.homePrice)],
      [
        `Down Payment (${formatPercent(calculation.downPaymentPercent)})`,
        formatCurrency(calculation.downPaymentAmount),
      ],
      ['CMHC Insurance', formatCurrency(calculation.cmhcPremiumAmount)],
      ['Loan Amount', formatCurrency(calculation.totalLoanAmount)],
      ['Total Interest Cost', formatCurrency(calculation.totalInterestCost)],
      ['Total Loan Cost', formatCurrency(calculation.totalLoanCost)],
      ['Mortgage Term', `${calculation.termYears} Years`],
      ['Interest Rate', formatPercent(calculation.interestRate)],
      ['Amortization Period', `${calculation.amortizationYears} Years`],
      ['Payment Frequency', calculation.paymentFrequency],
      ['No. of Payments', String(calculation.numberOfPayments)],
      ['Principal Paid Over Term', formatCurrency(calculation.principalPaidOverTerm)],
      ['Interest Paid Over Term', formatCurrency(calculation.interestPaidOverTerm)],
      ['Total Paid Over Term', formatCurrency(calculation.totalPaidOverTerm)],
      ['Balance After Term', formatCurrency(calculation.balanceAfterTerm)],
    ]),
  ].join('');
}

function renderTable(title: string, rows: Array<[string, string]>) {
  return `
    <div style="margin-top:20px;">
      <h3 style="margin:0 0 10px;font-size:16px;">${escapeHtml(title)}</h3>
      <table style="width:100%;border-collapse:collapse;font-size:14px;">
        <tbody>
          ${rows
            .map(
              ([label, value]) => `
                <tr>
                  <td style="padding:8px 10px;border:1px solid #e5e7eb;background:#f8fafc;font-weight:600;">${escapeHtml(label)}</td>
                  <td style="padding:8px 10px;border:1px solid #e5e7eb;">${escapeHtml(value)}</td>
                </tr>
              `
            )
            .join('')}
        </tbody>
      </table>
    </div>
  `;
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