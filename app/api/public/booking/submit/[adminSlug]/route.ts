import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Resend } from "resend";
import { createEventForAdmin } from "@/lib/google/calendar";
import { sendBookingToGhl } from "@/lib/ghl";

function money(cents: number) { return `$${(cents/100).toFixed(2)}`; }
function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '')
    .slice(0, 200);
}
async function generateUniqueSlug(clientName: string, propertyAddress: string) {
  const base = `${slugify(clientName)}/${slugify(propertyAddress)}`;
  let candidate = base;
  let n = 0;
  while (true) {
    const existing = await prisma.order.findUnique({ where: { slug: candidate } });
    if (!existing) return candidate;
    n += 1;
    candidate = `${base}-${Math.random().toString(36).slice(2, 6)}`;
    if (n > 10) throw new Error('Failed to generate unique slug');
  }
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ adminSlug: string }> }) {
  try {
    const { adminSlug } = await params;
    const body = await req.json().catch(() => ({}));

    const {
      address,
      formattedAddress,
      lat,
      lng,
      city,
      province,
      postalCode,
      country,
      placeId,
      propertySizeSqFt,
      notes,
      contactFirstName,
      contactLastName,
      contactEmail,
      contactPhone,
      company,
      serviceIds,
      slotStart,
      promoCode,
    } = body as any;

    if (!adminSlug) return NextResponse.json({ error: "Missing adminSlug" }, { status: 400 });
    if (!address || !contactFirstName || !contactLastName || !contactEmail) return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    if (!Array.isArray(serviceIds) || serviceIds.length === 0) return NextResponse.json({ error: "No services selected" }, { status: 400 });

    const idOrSlug = adminSlug;
    const admin = await prisma.user.findFirst({
      where: {
        AND: [
          { OR: [{ role: "ADMIN" as any }, { role: "SUPERADMIN" as any }] },
          { OR: [{ adminSlug: idOrSlug }, { id: idOrSlug }] },
        ],
      },
      select: { id: true, name: true, email: true },
    });
    if (!admin) return NextResponse.json({ error: "Admin not found" }, { status: 404 });

    // Settings for timezone and default buffers
    const settings = await prisma.adminBookingSettings.findUnique({ where: { adminId: admin.id } });
    if (!settings) return NextResponse.json({ error: "Booking settings not configured" }, { status: 409 });

    const svcRows = await prisma.service.findMany({
      where: { adminId: admin.id, id: { in: serviceIds }, active: true },
      select: {
        id: true,
        name: true,
        priceCents: true,
        durationMin: true,
        bufferBeforeMin: true,
        bufferAfterMin: true,
        category: { select: { name: true, description: true } },
        taxes: { select: { tax: { select: { name: true, rateBps: true } } } },
      },
    });
    if (svcRows.length === 0) return NextResponse.json({ error: "No valid services" }, { status: 400 });

    // Compute totals and end time
    const start = new Date(slotStart || Date.now());
    const coreDurationMin = svcRows.reduce((acc, s) => acc + s.durationMin, 0);
    const beforeBufferMin = svcRows.reduce((acc, s) => acc + s.bufferBeforeMin, 0);
    const afterBufferMin = svcRows.reduce((acc, s) => acc + s.bufferAfterMin, 0);
    const totalDurationMin = coreDurationMin + beforeBufferMin + afterBufferMin + settings.defaultBufferMin;
    const end = new Date(start.getTime() + totalDurationMin * 60 * 1000);

    let subtotal = 0;
    for (const s of svcRows) {
      subtotal += s.priceCents;
    }
    // We'll compute tax after promo discount is determined to ensure tax is based on discounted subtotal.

    // Upsert Realtor by email under this admin
    let realtor = await prisma.realtor.findUnique({ where: { email: contactEmail } });
    if (!realtor) {
      realtor = await prisma.realtor.create({ data: { email: contactEmail, firstName: contactFirstName, lastName: contactLastName, phone: contactPhone || null, companyName: company || null, userId: admin.id } });
    }
    // Ensure assignment link
    await prisma.realtorAssignment.upsert({
      where: { adminId_realtorId: { adminId: admin.id, realtorId: realtor.id } },
      update: {},
      create: { adminId: admin.id, realtorId: realtor.id },
    });

    // Apply promo code (enforce limits)
    let discountCents = 0;
    let appliedPromoCodeId: string | null = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findFirst({
        where: { adminId: admin.id, code: promoCode },
        include: { services: { select: { serviceId: true } } },
      });
      const now = new Date();
      if (!promo || !promo.active) {
        return NextResponse.json({ error: "Invalid promo code" }, { status: 400 });
      }
      if (promo.startDate && now < promo.startDate) return NextResponse.json({ error: "Promo code is not active yet" }, { status: 400 });
      if (promo.endDate && now > promo.endDate) return NextResponse.json({ error: "Promo code has expired" }, { status: 400 });

      // Usage limits
      if (promo.maxUsesTotal) {
        const usedTotal = await prisma.booking.count({ where: { appliedPromoCodeId: promo.id } }) +
          await prisma.order.count({ where: { appliedPromoCodeId: promo.id } });
        if (usedTotal >= promo.maxUsesTotal) return NextResponse.json({ error: "Promo code usage limit reached" }, { status: 400 });
      }
      if (promo.maxUsesPerRealtor) {
        const usedByThis = await prisma.booking.count({ where: { realtorId: realtor.id, appliedPromoCodeId: promo.id } }) +
          await prisma.order.count({ where: { realtorId: realtor.id, appliedPromoCodeId: promo.id } });
        if (usedByThis >= promo.maxUsesPerRealtor) return NextResponse.json({ error: "Promo code limit reached for this client" }, { status: 400 });
      }

      // Eligible subtotal based on applies-to services
      const eligibleServiceIds = new Set(promo.services.map(s => s.serviceId));
      const appliesToSubset = eligibleServiceIds.size > 0;
      const selectedEligible = appliesToSubset ? svcRows.filter(s => eligibleServiceIds.has(s.id)) : [];
      const baseForDiscount = appliesToSubset ? selectedEligible : svcRows;
      const eligibleSubtotal = baseForDiscount.reduce((acc, s) => acc + s.priceCents, 0);

      if (eligibleSubtotal > 0) {
        if (promo.discountType === "AMOUNT") {
          discountCents = Math.max(0, Math.min(promo.discountValueCents || 0, eligibleSubtotal));
        } else if (promo.discountType === "PERCENT") {
          const bps = promo.discountRateBps || 0;
          discountCents = Math.round((eligibleSubtotal * bps) / 10000);
          if (discountCents > eligibleSubtotal) discountCents = eligibleSubtotal;
        }
        appliedPromoCodeId = promo.id;
      }
    }

    // Compute per-service tax on discounted base
    let tax = 0;
    const itemTax: Record<string, number> = {};

    // Determine which services the discount applies to and prorate the discount across them
    const discountShares: Record<string, number> = {};
    if (discountCents > 0) {
      // Recreate eligibility similar to above
      // Note: if promo had no specific services configured, it applies to all selected services
      let baseForDiscount = svcRows;
      if (appliedPromoCodeId) {
        const promo = await prisma.promoCode.findFirst({
          where: { id: appliedPromoCodeId },
          include: { services: { select: { serviceId: true } } },
        });
        const eligibleIds = new Set(promo?.services.map(s => s.serviceId));
        const appliesToSubset = (promo?.services?.length || 0) > 0;
        baseForDiscount = appliesToSubset ? svcRows.filter(s => eligibleIds.has(s.id)) : svcRows;
      }
      const eligibleSubtotal = baseForDiscount.reduce((acc, s) => acc + s.priceCents, 0);
      if (eligibleSubtotal > 0) {
        // Pro-rate discount across eligible services
        let remaining = discountCents;
        for (let i = 0; i < baseForDiscount.length; i++) {
          const s = baseForDiscount[i];
          const isLast = i === baseForDiscount.length - 1;
          let share = isLast
            ? remaining
            : Math.round((discountCents * s.priceCents) / eligibleSubtotal);
          if (share > remaining) share = remaining;
          discountShares[s.id] = share;
          remaining -= share;
        }
      }
    }

    for (const s of svcRows) {
      const discountShare = discountShares[s.id] || 0;
      const baseAfter = Math.max(0, s.priceCents - discountShare);
      const t = s.taxes.reduce((acc, r) => acc + Math.round((baseAfter * r.tax.rateBps) / 10000), 0);
      itemTax[s.id] = t;
      tax += t;
    }

    const finalTotalCents = Math.max(0, (subtotal - discountCents) + tax);

    // Create Booking and items
    const booking = await prisma.booking.create({
      data: {
        adminId: admin.id,
        realtorId: realtor.id,
        status: "CONFIRMED" as any,
        start,
        end,
        timeZone: settings.timeZone,
        propertyAddress: address,
        propertyFormattedAddress: formattedAddress || null,
        propertyLat: lat ?? null,
        propertyLng: lng ?? null,
        propertyCity: city || null,
        propertyProvince: province || null,
        propertyPostalCode: postalCode || null,
        propertyCountry: country || null,
        propertyPlaceId: placeId || null,
        propertySizeSqFt: propertySizeSqFt || null,
        contactName: `${contactFirstName} ${contactLastName}`,
        contactEmail,
        contactPhone: contactPhone || null,
        notes: notes || null,
        subtotalCents: subtotal,
        taxCents: tax,
        discountCents,
        appliedPromoCodeId,
        totalCents: finalTotalCents,
        items: {
          create: svcRows.map((s) => ({
            serviceId: s.id,
            serviceName: s.name,
            unitPriceCents: s.priceCents,
            taxCents: itemTax[s.id] || 0,
          })),
        },
      },
      select: { id: true, start: true, end: true, totalCents: true, subtotalCents: true, taxCents: true, discountCents: true },
    });

    // Also create an Order with minimum required info
    const clientName = `${realtor.firstName ?? ''} ${realtor.lastName ?? ''}`.trim() || realtor.email || 'client';
    const orderSlug = await generateUniqueSlug(clientName, address);
    try {
      await prisma.order.create({
        data: {
          realtorId: realtor.id,
          slug: orderSlug,
          status: 'DRAFT' as any,
          propertyAddress: address,
          propertyFormattedAddress: formattedAddress || null,
          propertyLat: lat ?? null,
          propertyLng: lng ?? null,
          propertyCity: city || null,
          propertyProvince: province || null,
          propertyPostalCode: postalCode || null,
          propertyCountry: country || null,
          propertyPlaceId: placeId || null,
          propertySize: propertySizeSqFt ?? null,
          description: notes || null,
          discountCents,
          appliedPromoCodeId: appliedPromoCodeId || undefined,
        },
      });
    } catch (e) {
      console.warn('[BOOKING] Order creation skipped/failed:', e);
    }

    // Create Google Calendar event immediately for PENDING booking (if connected)
    try {
      const eventStart = new Date(start.getTime());
      const eventEnd = new Date(start.getTime() + (coreDurationMin) * 60 * 1000);
      const event = await createEventForAdmin(admin.id, {
        calendarId: settings.googleCalendarId || undefined,
        summary: `${formattedAddress || address} - ${contactFirstName} ${contactLastName}`,
        description: [
          `Client: ${contactFirstName} ${contactLastName} (${contactEmail}${contactPhone ? ", "+contactPhone : ''})`,
          company ? `Company: ${company}` : null,
          notes ? `Notes: ${notes}` : null,
        ].filter(Boolean).join("\n"),
        startISO: eventStart.toISOString(),
        endISO: eventEnd.toISOString(),
        timeZone: settings.timeZone,
        attendees: [
          { email: contactEmail, displayName: `${contactFirstName} ${contactLastName}` },
          ...(admin.email ? [{ email: admin.email }] : []),
        ],
        location: formattedAddress || address,
      });
      if (event?.id) {
        await prisma.booking.update({ where: { id: booking.id }, data: { googleEventId: event.id } as any });
      }
    } catch (e) {
      console.warn('[BOOKING] Google event creation failed; continuing', e);
    }

    // Push contact + booking details to Go High Level (non-blocking)
    try {
      await sendBookingToGhl({
        contactFirstName,
        contactLastName,
        contactEmail,
        contactPhone: contactPhone || null,
        address: formattedAddress || address,
        startISO: start.toISOString(),
        timeZone: settings.timeZone,
        city: city || null,
      });
    } catch (e) {
      console.warn('[BOOKING] GHL push failed; continuing', e);
    }

    // Emails
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.RESEND_FROM || "Photos 4 Real Estate <no-reply@photos4realestate.ca>";
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL("/", req.nextUrl).toString().replace(/\/$/, "");

    if (apiKey) {
      const resend = new Resend(apiKey);
      const primary = svcRows[0];
      const catName = primary?.category?.name || '';
      const catDesc = primary?.category?.description || '';
      const svcName = primary?.name || '';
      const dt = new Date(start);
      const dateStr = dt.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
      const timeStr = dt
        .toLocaleString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true, timeZone: settings.timeZone })
        .replace('AM', 'a.m.')
        .replace('PM', 'p.m.');

      const customerSubject = `We received your booking request for ${formattedAddress || address}`;
      const customerHtml = `
        <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
          <div style="max-width:600px;margin:0 auto;">
            <img src="https://wwd-videos.s3.ca-central-1.amazonaws.com/emai-header-1920.jpg"
                 alt="Photos 4 Real Estate" width="600"
                 style="display:block;max-width:100%;height:auto;margin:0 auto 16px;" />
          </div>
          <p>Hi ${contactFirstName},</p>
          <p>We're all set for your appointment!</p>
          <h3 style="margin:16px 0 8px">Booking Details:</h3>
          <p><strong>Address:</strong> ${formattedAddress || address}</p>
          <p><strong>Date & time:</strong> ${dateStr}, at ${timeStr}</p>
          <h3 style="margin:16px 0 8px">Selected Service:</h3>
          <p>${catName ? `<strong>${catName}</strong><br />` : ''}${catDesc ? `${catDesc}<br />` : ''}${svcName}</p>
          <p style="margin-top:24px">Thank you for your business!</p>
          <p>Photos 4 Real Estate<br/>📧 info@photos4realestate.ca<br/>📞 (825) 449-5001</p>
        </div>
      `;
      await resend.emails.send({ from, to: contactEmail, subject: customerSubject, html: customerHtml });

      if (admin.email) {
        const adminSubject = `New Booking Request Received for ${formattedAddress || address}`;
        const adminHtml = `
          <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.6; color:#111;">
            <h2 style="margin:0 0 12px">A new booking request has been received.</h2>
            <h3 style="margin:16px 0 8px">Booking Details:</h3>
            <p><strong>Address:</strong> ${formattedAddress || address}</p>
            <p><strong>Date & time:</strong> ${dateStr}, at ${timeStr}</p>
            <h3 style="margin:16px 0 8px">Selected Service:</h3>
            <p>${catName ? `<strong>${catName}</strong><br />` : ''}${catDesc ? `${catDesc}<br />` : ''}${svcName}</p>
            <h3 style="margin:16px 0 8px">Client:</h3>
            <p><strong>First Name:</strong> ${contactFirstName || ''}</p>
            <p><strong>Last Name:</strong> ${contactLastName || ''}</p>
            <p><strong>Email:</strong> ${contactEmail}</p>
            <p><strong>Phone:</strong> ${contactPhone || ''}</p>
            <p><strong>Company name:</strong> ${company || ''}</p>
            <h3 style="margin:16px 0 8px">Pricing:</h3>
            <p><strong>Total:</strong> ${money(booking.totalCents)}</p>
            <p style="margin-top:16px">Please review and confirm with the client.</p>
          </div>
        `;
        await resend.emails.send({ from, to: admin.email, subject: adminSubject, html: adminHtml });
      }
    } else {
      console.log("[BOOKING EMAIL] skipped; RESEND_API_KEY not set");
    }

    return NextResponse.json({ ok: true, bookingId: booking.id });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to submit booking" }, { status: 500 });
  }
}

