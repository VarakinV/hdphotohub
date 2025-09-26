import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";
import { z } from "zod";

const updateSchema = z.object({
  name: z.string().min(1).optional(),
  rateBps: z.number().int().min(0).max(10000).optional(),
  active: z.boolean().optional(),
});

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    const { id } = await params;

    const where: any = me.role === "SUPERADMIN" ? { id } : { id, adminId: me.id };
    const row = await prisma.tax.findFirst({ where });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json(row);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to fetch tax" }, { status: 500 });
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
    const existing = await prisma.tax.findFirst({ where });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const body = await req.json();
    const parsed = updateSchema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid fields", details: parsed.error.flatten() }, { status: 400 });

    const updated = await prisma.tax.update({ where: { id }, data: {
      name: parsed.data.name ?? existing.name,
      rateBps: parsed.data.rateBps ?? existing.rateBps,
      active: parsed.data.active ?? existing.active,
    }});
    return NextResponse.json(updated);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to update tax" }, { status: 500 });
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
    const existing = await prisma.tax.findFirst({ where });
    if (!existing) return NextResponse.json({ error: "Not found" }, { status: 404 });

    const svcCount = await prisma.serviceTax.count({ where: { taxId: id } });
    if (svcCount > 0) {
      return NextResponse.json({ error: "Cannot delete tax applied to services", details: ["Remove from services first."] }, { status: 409 });
    }

    await prisma.tax.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "Failed to delete tax" }, { status: 500 });
  }
}

