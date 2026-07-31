import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { Resend } from 'resend';

async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || 'Photos 4 Real Estate <onboarding@resend.dev>';
  if (!apiKey) {
    console.warn('[QR WEEKLY DIGEST] RESEND_API_KEY not set; logging instead.');
    console.log('[QR WEEKLY DIGEST EMAIL]', { to, subject });
    return { ok: false as const, skipped: true as const };
  }
  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
    });
    if (error) {
      console.error('[QR WEEKLY DIGEST] Resend error', error);
      return { ok: false as const, error: String(error) };
    }
    return { ok: true as const, id: data?.id };
  } catch (err) {
    console.error('[QR WEEKLY DIGEST] Resend send failed', err);
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

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const assignments = await prisma.qRAssignment.findMany({
      where: {
        unassignedAt: null,
        sendWeeklyStats: true,
      },
      include: {
        qrCode: true,
        order: {
          include: {
            realtor: true,
          },
        },
        scans: {
          where: {
            scannedAt: {
              gte: sevenDaysAgo,
            },
          },
        },
        leads: {
          where: {
            createdAt: {
              gte: sevenDaysAgo,
            },
          },
        },
      },
    });

    const groupedByRealtor = new Map<string, typeof assignments>();

    for (const assignment of assignments) {
      const realtorEmail = assignment.order.realtor.email;
      if (!realtorEmail) continue;

      if (!groupedByRealtor.has(realtorEmail)) {
        groupedByRealtor.set(realtorEmail, []);
      }
      groupedByRealtor.get(realtorEmail)!.push(assignment);
    }

    let emailsSent = 0;
    let emailsSkipped = 0;

    for (const [realtorEmail, realtorAssignments] of groupedByRealtor.entries()) {
      const totalScans = realtorAssignments.reduce((sum, a) => sum + a.scans.length, 0);
      const totalLeads = realtorAssignments.reduce((sum, a) => sum + a.leads.length, 0);

      if (totalScans === 0 && totalLeads === 0) {
        emailsSkipped++;
        continue;
      }

      const realtor = realtorAssignments[0].order.realtor;
      const subject = `Your Weekly QR Code Stats - ${totalScans} scans, ${totalLeads} leads`;

      let html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ca4153;">Weekly QR Code Stats</h2>
          <p>Hi ${escapeHtml(realtor.firstName)},</p>
          <p>Here's your QR code activity for the past 7 days:</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
      `;

      for (const assignment of realtorAssignments) {
        const propertyAddress = assignment.order.propertyFormattedAddress || assignment.order.propertyAddress;
        const scans = assignment.scans.length;
        const leads = assignment.leads.length;

        html += `
          <div style="margin-bottom: 20px;">
            <h3 style="margin: 0 0 10px 0;">${escapeHtml(propertyAddress)}</h3>
            <p style="margin: 5px 0;"><strong>QR Code:</strong> ${assignment.qrCode.displayId}</p>
            <p style="margin: 5px 0;"><strong>Scans:</strong> ${scans}</p>
            <p style="margin: 5px 0;"><strong>Leads:</strong> ${leads}</p>
        `;

        if (assignment.leads.length > 0) {
          html += `<div style="margin-top: 10px;"><strong>Recent Leads:</strong><ul style="margin: 5px 0; padding-left: 20px;">`;
          for (const lead of assignment.leads.slice(0, 5)) {
            html += `<li>${escapeHtml(lead.name)} - ${escapeHtml(lead.email || lead.phone || '')}</li>`;
          }
          if (assignment.leads.length > 5) {
            html += `<li>... and ${assignment.leads.length - 5} more</li>`;
          }
          html += `</ul></div>`;
        }

        html += `</div>`;
      }

      html += `
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
          <p style="color: #666; font-size: 12px;">
            You're receiving this email because you have weekly stats enabled for your QR codes.
            You can disable this in your QR code management settings.
          </p>
        </div>
      `;

      const result = await sendEmail({
        to: realtorEmail,
        subject,
        html,
      });

      if (result.ok) {
        emailsSent++;
      } else {
        console.error(`[QR WEEKLY DIGEST] Failed to send to ${realtorEmail}`);
      }
    }

    return NextResponse.json({
      ok: true,
      emailsSent,
      emailsSkipped,
      totalAssignments: assignments.length,
    });
  } catch (e) {
    console.error('[QR WEEKLY DIGEST]', e);
    return NextResponse.json({ error: 'Failed to send weekly digest' }, { status: 500 });
  }
}
