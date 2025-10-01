import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  iconKey: z.string().optional().nullable(),
  featured: z.boolean().optional(),
  active: z.boolean().optional(),
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
    const row = await prisma.serviceCategory.findFirst({ where });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch category" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const { id } = await params;
    const body = await req.json();
    const parsed = categoryUpdateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });

    const where: any = me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id };
    const existing = await prisma.serviceCategory.findFirst({ where });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const nextSlug = parsed.data.name ? slugify(parsed.data.name) : existing.slug;

    const updated = await prisma.serviceCategory.update({
      where: { id },
      data: {
        name: parsed.data.name ?? existing.name,
        slug: nextSlug,
        description: parsed.data.description ?? existing.description,
        iconUrl: parsed.data.iconUrl ?? existing.iconUrl,
        iconKey: parsed.data.iconKey ?? existing.iconKey,
        featured: parsed.data.featured ?? existing.featured,
        active: parsed.data.active ?? existing.active,
      },
    });
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update category" }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    const { id } = await params;

    // Scope
    const where: any = me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id };
    const cat = await prisma.serviceCategory.findFirst({ where });
    if (!cat) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Prevent delete if has services
    const svcCount = await prisma.service.count({ where: { categoryId: id } });
    if (svcCount > 0) {
      return NextResponse.json({ error: "Cannot delete category with services", details: ["Delete or move services first."] }, { status: 409 });
    }

    await prisma.serviceCategory.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete category" }, { status: 500 });
  }
}

