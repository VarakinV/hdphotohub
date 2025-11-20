import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/db/prisma';
import { verifyRecaptchaServer } from '@/lib/recaptcha/verify';
import { isS3Available, uploadBufferToS3WithPath } from '@/lib/utils/s3';
import { generateStyledQrAssets, type QrVariant } from '@/lib/qr/generator';
import { upsertContact, addTags } from '@/lib/ghl';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

type StylePayload = {
  dotsType?: string;
  cornersSquareType?: string;
  cornersDotType?: string;
  darkColor?: string;
  lightColor?: string;
} | undefined;

function getBaseUrlFromHeaders(hdrs: Headers): string {
  const host = hdrs.get('x-forwarded-host') ?? hdrs.get('host');
  const proto = hdrs.get('x-forwarded-proto') ?? (process.env.NODE_ENV === 'development' ? 'http' : 'https');
  const base = process.env.NEXT_PUBLIC_APP_URL || (host ? `${proto}://${host}` : '');
  return (base || '').replace(/\/$/, '');
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({} as any));
    const { leadId, firstName, lastName, email, phone, destinationUrl, recaptchaToken, style, logoDataUrl, logoUrl } =
      (body || {}) as {
        leadId?: string;
        firstName?: string;
        lastName?: string;
        email?: string;
        phone?: string;
        destinationUrl?: string;
        recaptchaToken?: string;
        style?: StylePayload;
        logoDataUrl?: string | null;
        logoUrl?: string | null;
      };

    const recaptcha = await verifyRecaptchaServer(recaptchaToken, 'free_qr_submit');
    if (!recaptcha.ok) {
      return NextResponse.json({ error: 'reCAPTCHA failed' }, { status: 400 });
    }

    if (!firstName || !lastName) {
      return NextResponse.json({ error: 'First and last name are required' }, { status: 400 });
    }
    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 });
    }
    if (!destinationUrl) {
      return NextResponse.json({ error: 'Destination URL is required' }, { status: 400 });
    }

    if (!isS3Available()) {
      return NextResponse.json({ error: 'S3 not configured' }, { status: 503 });
    }

    let targetUrl = String(destinationUrl).trim();
    if (!/^https?:\/\//i.test(targetUrl)) {
      targetUrl = `https://${targetUrl}`;
    }

    // sanitize style overrides to safe values once (used by async worker)
    const allowedDots = new Set(['square', 'dots', 'rounded']);
    const allowedCornersSq = new Set(['square', 'extra-rounded']);
    const allowedCornersDot = new Set(['square', 'dot']);
    const safeStyle = style && typeof style === 'object'
      ? {
          dotsType: allowedDots.has(String(style.dotsType || ''))
            ? String(style.dotsType)
            : undefined,
          cornersSquareType: allowedCornersSq.has(
            String(style.cornersSquareType || ''),
          )
            ? String(style.cornersSquareType)
            : undefined,
          cornersDotType: allowedCornersDot.has(
            String(style.cornersDotType || ''),
          )
            ? String(style.cornersDotType)
            : undefined,
          darkColor:
            typeof style.darkColor === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(style.darkColor)
              ? style.darkColor.startsWith('#')
                ? style.darkColor
                : `#${style.darkColor}`
              : undefined,
          lightColor:
            typeof style.lightColor === 'string' && /^#?[0-9a-fA-F]{3,8}$/.test(style.lightColor)
              ? style.lightColor.startsWith('#')
                ? style.lightColor
                : `#${style.lightColor}`
              : undefined,
        }
      : undefined;

    // Create or update lead (DRAFT -> GENERATING)
    const lead = leadId
      ? await prisma.freeQrLead.update({
          where: { id: leadId },
          data: {
            firstName,
            lastName,
            email,
            phone: phone || null,
            destinationUrl: targetUrl,
            status: 'GENERATING',
          },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        })
      : await prisma.freeQrLead.create({
          data: {
            firstName,
            lastName,
            email,
            phone: phone || null,
            destinationUrl: targetUrl,
            status: 'GENERATING',
          },
          select: { id: true, firstName: true, lastName: true, email: true, phone: true },
        });

    const id = lead.id;
    const basePath = `free-qr/${id}`;

    // Determine if we should create a fourth "custom" variant that applies the user's overrides exactly
    const hasStyleOverrides = !!(
      safeStyle && (
        safeStyle.dotsType ||
        safeStyle.cornersSquareType ||
        safeStyle.cornersDotType ||
        safeStyle.darkColor ||
        safeStyle.lightColor
      )
    );
    const VARIANTS: QrVariant[] = ['professional', 'modern', 'social', ...(hasStyleOverrides ? (['custom'] as QrVariant[]) : [])];

    // If any QR codes are already queued/rendering/complete for this lead, treat as idempotent
    const existingAny = await prisma.freeQr.findFirst({
      where: { leadId: id, status: { in: ['QUEUED', 'RENDERING', 'COMPLETE'] as any } },
      select: { id: true },
    });
    if (existingAny) {
      return NextResponse.json({ ok: true, id });
    }

    // Pre-normalize logo URL once to a data URL for reliable headless rendering
    let precomputedLogoDataUrl: string | undefined = undefined;
    if (typeof logoUrl === 'string' && logoUrl) {
      try {
        const resp = await fetch(logoUrl);
        if (resp.ok) {
          const buf = Buffer.from(await resp.arrayBuffer());
          const ct = resp.headers.get('content-type') || 'image/png';
          precomputedLogoDataUrl = `data:${ct};base64,${buf.toString('base64')}`;
        }
      } catch {}
    } else if (typeof logoDataUrl === 'string' && logoDataUrl.startsWith('data:')) {
      precomputedLogoDataUrl = logoDataUrl;
    }

    // Kick off generation asynchronously so UI can show progress page
    setTimeout(async () => {
      try {
        // initialize/queue records to show immediate progress
        for (const variant of VARIANTS) {
          await prisma.freeQr.upsert({
            where: { leadId_variantKey: { leadId: id, variantKey: variant } },
            create: { leadId: id, variantKey: variant, status: 'QUEUED' },
            update: { status: 'QUEUED' },
          });
        }

        for (const variant of VARIANTS) {
          await prisma.freeQr.update({
            where: { leadId_variantKey: { leadId: id, variantKey: variant } },
            data: { status: 'RENDERING' },
          });

          const { svg, png, pdf } = await generateStyledQrAssets(targetUrl, variant, {
            // Keep presets as-is; only the "custom" variant applies the user's overrides
            style: variant === 'custom' ? safeStyle : undefined,
            logoDataUrl: precomputedLogoDataUrl,
          });

          const svgName = `${variant}.svg`;
          const { fileUrl: svgUrl } = await uploadBufferToS3WithPath(
            basePath,
            svgName,
            Buffer.from(svg),
            'image/svg+xml',
          );

          const pngName = `${variant}.png`;
          const { fileUrl: pngUrl } = await uploadBufferToS3WithPath(
            basePath,
            pngName,
            png,
            'image/png',
          );

          const pdfName = `${variant}.pdf`;
          const { fileUrl: pdfUrl } = await uploadBufferToS3WithPath(
            basePath,
            pdfName,
            pdf,
            'application/pdf',
          );

          await prisma.freeQr.upsert({
            where: { leadId_variantKey: { leadId: id, variantKey: variant } },
            create: {
              leadId: id,
              variantKey: variant,
              status: 'COMPLETE',
              svgUrl,
              pngUrl,
              pdfUrl,
            },
            update: { status: 'COMPLETE', svgUrl, pngUrl, pdfUrl },
          });
        }

        await prisma.freeQrLead.update({ where: { id }, data: { status: 'COMPLETE' } });

        // Best-effort GHL integration
        try {
          const locationId = process.env.GHL_LOCATION_ID;
          if (locationId) {
            const pageUrl = `${getBaseUrlFromHeaders(req.headers)}/free-qr/${id}`;
            const contactId = await upsertContact({
              firstName: lead.firstName || '',
              lastName: lead.lastName || '',
              email: lead.email || '',
              phone: lead.phone || '',
              locationId,
              customFields: [{ key: 'free_qr_page_url', field_value: pageUrl }],
            });
            if (contactId) {
              await prisma.freeQrLead.update({ where: { id }, data: { ghlContactId: contactId } });
              await addTags(contactId, ['realtor', 'used free qr tool']);
            }
          }
        } catch (e) {
          console.warn('[FreeQr] GHL integration failed; continuing', e);
        }
      } catch (err) {
        console.error('Free QR async generation failed', err);
        try {
          await prisma.freeQrLead.update({ where: { id }, data: { status: 'FAILED' } });
        } catch {}
      }
    }, 0);

    // Return immediately so the UI can show the progress phase
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    console.error('free-qr/submit failed', e);
    return NextResponse.json({ error: 'Failed to generate QR codes' }, { status: 500 });
  }
}

