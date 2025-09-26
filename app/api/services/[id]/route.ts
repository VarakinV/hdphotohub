import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  categoryId: z.string().min(1).optional(),
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0).optional(),
  durationMin: z.number().int().min(0).optional(),
  bufferBeforeMin: z.number().int().min(0).optional(),
  bufferAfterMin: z.number().int().min(0).optional(),
  minSqFt: z.number().int().min(0).optional().nullable(),
  maxSqFt: z.number().int().min(0).optional().nullable(),
  active: z.boolean().optional(),
  taxIds: z.array(z.string().min(1)).optional(),
});

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    const { id } = await params;

    const where: any = me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id };
    const row = await prisma.service.findFirst({ where, include: { category: true, taxes: { include: { tax: true } } } });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const data = { ...row, taxes: row.taxes.map((t) => t.tax) };
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const where: any = me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id };
    const existing = await prisma.service.findFirst({ where });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const raw = await req.json();
    const parsed = updateSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });

    // Validate category if changing
    if (parsed.data.categoryId) {
      const catOk = await prisma.serviceCategory.findFirst({
        where: me.role === "SUPERADMIN" ? { id: parsed.data.categoryId } : { id: parsed.data.categoryId, adminId: me.id },
      });
      if (!catOk) return NextResponse.json({ error: "Category not found" }, { status: 404 });
    }

    const nextName = parsed.data.name ?? existing.name;
    const targetCategoryId = parsed.data.categoryId ?? existing.categoryId;

    // Rebuild slug only if name or category changes; ensure uniqueness per admin
    let nextSlug = existing.slug;
    if (parsed.data.name !== undefined || parsed.data.categoryId !== undefined) {
      const cat = await prisma.serviceCategory.findFirst({
        where: me.role === "SUPERADMIN" ? { id: targetCategoryId } : { id: targetCategoryId, adminId: me.id },
      });
      if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });
      const baseSlug = `${cat.slug}-${slugify(nextName)}`;
      let slug = baseSlug;
      let counter = 2;
      while (
        await prisma.service.findFirst({
          where: { adminId: existing.adminId, slug, NOT: { id } },
        })
      ) {
        slug = `${baseSlug}-${counter++}`;
      }
      nextSlug = slug;
    }

    const updated = await prisma.service.update({
      where: { id },
      data: {
        categoryId: targetCategoryId,
        name: nextName,
        slug: nextSlug,
        description: parsed.data.description ?? existing.description,
        priceCents: parsed.data.priceCents ?? existing.priceCents,
        durationMin: parsed.data.durationMin ?? existing.durationMin,
        bufferBeforeMin: parsed.data.bufferBeforeMin ?? existing.bufferBeforeMin,
        bufferAfterMin: parsed.data.bufferAfterMin ?? existing.bufferAfterMin,
        minSqFt: parsed.data.minSqFt ?? existing.minSqFt,
        maxSqFt: parsed.data.maxSqFt ?? existing.maxSqFt,
        active: parsed.data.active ?? existing.active,
      },
    });

    // Sync taxes if provided
    if (parsed.data.taxIds) {
      const taxIds = parsed.data.taxIds;
      // Validate ownership
      const count = await prisma.tax.count({ where: me.role === "SUPERADMIN" ? { id: { in: taxIds } } : { id: { in: taxIds }, adminId: me.id } });
      if (count !== taxIds.length) return NextResponse.json({ error: "Some taxes not found" }, { status: 404 });

      const existingLinks = await prisma.serviceTax.findMany({ where: { serviceId: id } });
      const existingSet = new Set(existingLinks.map((l) => l.taxId));
      const desiredSet = new Set(taxIds);

      const toAdd = taxIds.filter((t) => !existingSet.has(t));
      const toRemove = [...existingSet].filter((t) => !desiredSet.has(t));

      if (toAdd.length) {
        await prisma.serviceTax.createMany({ data: toAdd.map((taxId) => ({ serviceId: id, taxId })), skipDuplicates: true });
      }
      if (toRemove.length) {
        await prisma.serviceTax.deleteMany({ where: { serviceId: id, taxId: { in: toRemove } } });
      }
    }

    const full = await prisma.service.findUnique({ where: { id }, include: { category: true, taxes: { include: { tax: true } } } });
    const data = full ? { ...full, taxes: full.taxes.map((t) => t.tax) } : updated;
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update service" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const where: any = me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id };
    const existing = await prisma.service.findFirst({ where });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Prevent delete if referenced by bookings
    const usedCount = await prisma.bookingService.count({ where: { serviceId: id } });
    if (usedCount > 0) {
      return NextResponse.json({ error: "Cannot delete a service used by bookings" }, { status: 409 });
    }

    await prisma.serviceTax.deleteMany({ where: { serviceId: id } });
    await prisma.service.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete service" }, { status: 500 });
  }
}

