import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const me: any = session.user;
    if (!(me.role === "ADMIN" || me.role === "SUPERADMIN"))
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const body = await req.json();
    const ids: string[] = Array.isArray(body?.ids) ? body.ids : [];
    if (!ids.length)
      return NextResponse.json({ error: "No ids provided" }, { status: 400 });

    // Scope to current admin unless SUPERADMIN
    const whereScope =
      me.role === "SUPERADMIN"
        ? { id: { in: ids } }
        : { id: { in: ids }, adminId: me.id };
    const found = await prisma.serviceCategory.findMany({
      where: whereScope,
      select: { id: true },
    });
    const foundIds = new Set(found.map((f) => f.id));
    const filtered = ids.filter((id) => foundIds.has(id));
    if (!filtered.length)
      return NextResponse.json(
        { error: "No matching categories" },
        { status: 404 }
      );

    await prisma.$transaction(
      filtered.map((id, index) =>
        prisma.serviceCategory.update({ where: { id }, data: { sortOrder: index } })
      )
    );

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json(
      { error: "Failed to reorder categories" },
      { status: 500 }
    );
  }
}

