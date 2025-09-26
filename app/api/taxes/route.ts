import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const createSchema = z.object({
  name: z.string().min(1),
  rateBps: z.number().int().min(0).max(10000), // up to 100%
  active: z.boolean().optional(),
});

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  rateBps: z.number().int().min(0).max(10000).optional(),
  active: z.boolean().optional(),
});

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;

    if (me.role === "SUPERADMIN") {
      const rows = await prisma.tax.findMany({ orderBy: { name: "asc" } });
      return NextResponse.json(rows);
    }
    if (me.role === "ADMIN") {
      const rows = await prisma.tax.findMany({ where: { adminId: me.id }, orderBy: { name: "asc" } });
      return NextResponse.json(rows);
    }
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch taxes" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const parsed = createSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });

    const created = await prisma.tax.create({
      data: { adminId: me.id, name: parsed.data.name, rateBps: parsed.data.rateBps, active: parsed.data.active ?? true },
    });
    return NextResponse.json(created, { status: 201 });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to create tax" }, { status: 500 });
  }
}

