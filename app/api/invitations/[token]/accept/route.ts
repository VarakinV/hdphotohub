import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashToken } from "@/lib/utils/invite";
import { hashPassword, validatePassword } from "@/lib/utils/password";

export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  try {
    const { token } = await params;
    const { name, password } = (await req.json().catch(() => ({}))) as { name?: string; password?: string };

    if (!password) return NextResponse.json({ error: "Password is required" }, { status: 400 });
    const pw = validatePassword(password);
    if (!pw.isValid) return NextResponse.json({ error: "Weak password", details: pw.errors }, { status: 400 });

    const tokenHash = hashToken(token);

    const invite = await prisma.invitation.findFirst({
      where: { tokenHash },
      include: { realtor: true },
    });

    if (!invite) return NextResponse.json({ error: "Invalid invitation" }, { status: 404 });
    if (invite.acceptedAt) return NextResponse.json({ error: "Invitation already accepted" }, { status: 409 });
    if (invite.expiresAt < new Date()) return NextResponse.json({ error: "Invitation expired" }, { status: 410 });

    // Upsert user by email
    const hashed = await hashPassword(password);

    const user = await prisma.user.upsert({
      where: { email: invite.email },
      update: {
        password: hashed,
        role: invite.role,
        realtorId: invite.realtorId ?? undefined,
        name: name ?? undefined,
      },
      create: {
        email: invite.email,
        password: hashed,
        role: invite.role,
        realtorId: invite.realtorId ?? undefined,
        name: name ?? undefined,
      },
      select: { id: true, email: true },
    });

    await prisma.invitation.update({ where: { id: invite.id }, data: { acceptedAt: new Date() } });

    return NextResponse.json({ message: "Invitation accepted", user }, { status: 200 });
  } catch (err) {
    console.error("Accept invitation error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

