import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const categoryCreateSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  iconKey: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

const categoryUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional().nullable(),
  iconUrl: z.string().url().optional().nullable(),
  iconKey: z.string().optional().nullable(),
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

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;

    if (me.role === "SUPERADMIN") {
      const rows = await prisma.serviceCategory.findMany({ orderBy: { name: "asc" } });
      return NextResponse.json(rows);
    }
    if (me.role === "ADMIN") {
      const rows = await prisma.serviceCategory.findMany({ where: { adminId: me.id }, orderBy: { name: "asc" } });
      return NextResponse.json(rows);
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch categories" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = categoryCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });
    }

    const slug = slugify(parsed.data.name);
    const created = await prisma.serviceCategory.create({
      data: {
        adminId: me.id,
        name: parsed.data.name,
        slug,
        description: parsed.data.description ?? null,
        iconUrl: parsed.data.iconUrl ?? null,
        iconKey: parsed.data.iconKey ?? null,
        active: parsed.data.active ?? true,
      },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create category" }, { status: 500 });
  }
}

