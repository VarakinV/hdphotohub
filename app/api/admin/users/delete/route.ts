import { NextResponse } from "next/server";
import { auth } from "@/lib/auth/auth";
import { prisma } from "@/lib/db/prisma";

export async function POST(request: Request) {
  try {
    const session = await auth();
    const me = session?.user as any | null;
    if (!me || me.role !== "SUPERADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const userId = String(body?.userId || "");
    if (!userId) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    if (userId === me.id) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

    const target = await prisma.user.findUnique({ where: { id: userId }, select: { id: true, role: true } });
    if (!target) return NextResponse.json({ error: "User not found" }, { status: 404 });
    if (target.role === "SUPERADMIN") return NextResponse.json({ error: "Cannot delete SUPERADMIN" }, { status: 400 });

    await prisma.$transaction([
      prisma.realtor.updateMany({ where: { userId }, data: { userId: me.id } }),
      prisma.invitation.updateMany({ where: { invitedById: userId }, data: { invitedById: me.id } }),
      prisma.user.delete({ where: { id: userId } }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("Delete user error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

