import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createSchema = z.object({
  categoryId: z.string().min(1),
  name: z.string().min(1),
  description: z.string().optional().nullable(),
  priceCents: z.number().int().min(0),
  durationMin: z.number().int().min(0),
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;

    const where: any = me.role === "SUPERADMIN" ? {} : { adminId: me.id };
    const rows = await prisma.service.findMany({
      where,
      include: { category: true, taxes: { include: { tax: true } } },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    });
    // Flatten taxes for convenience
    const data = rows.map((s) => ({
      ...s,
      taxes: s.taxes.map((t) => t.tax),
    }));
    return NextResponse.json(data);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const raw = await req.json();
    const parsed = createSchema.safeParse(raw);
    if (!parsed.success) return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });

    // Ensure category belongs to admin
    const cat = await prisma.serviceCategory.findFirst({
      where: me.role === "SUPERADMIN" ? { id: parsed.data.categoryId } : { id: parsed.data.categoryId, adminId: me.id },
    });
    if (!cat) return NextResponse.json({ error: "Category not found" }, { status: 404 });

    // Build a slug using category slug + service name; ensure uniqueness per admin
    const baseSlug = `${cat.slug}-${slugify(parsed.data.name)}`;
    let slug = baseSlug;
    let counter = 2;
    while (await prisma.service.findFirst({ where: { adminId: me.id, slug } })) {
      slug = `${baseSlug}-${counter++}`;
    }

    const created = await prisma.service.create({
      data: {
        adminId: me.id,
        categoryId: parsed.data.categoryId,
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? null,
        priceCents: parsed.data.priceCents,
        durationMin: parsed.data.durationMin,
        bufferBeforeMin: parsed.data.bufferBeforeMin ?? 0,
        bufferAfterMin: parsed.data.bufferAfterMin ?? 0,
        minSqFt: parsed.data.minSqFt ?? null,
        maxSqFt: parsed.data.maxSqFt ?? null,
        active: parsed.data.active ?? true,
      },
    });

    // Apply taxes
    const taxIds = parsed.data.taxIds ?? [];
    if (taxIds.length) {
      // Validate tax ownership
      const count = await prisma.tax.count({ where: me.role === "SUPERADMIN" ? { id: { in: taxIds } } : { id: { in: taxIds }, adminId: me.id } });
      if (count !== taxIds.length) {
        return NextResponse.json({ error: "Some taxes not found" }, { status: 404 });
      }
      await prisma.serviceTax.createMany({
        data: taxIds.map((taxId) => ({ serviceId: created.id, taxId })),
        skipDuplicates: true,
      });
    }

    const full = await prisma.service.findUnique({
      where: { id: created.id },
      include: { category: true, taxes: { include: { tax: true } } },
    });
    const data = full ? { ...full, taxes: full.taxes.map((t) => t.tax) } : created;
    return NextResponse.json(data, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create service" }, { status: 500 });
  }
}

