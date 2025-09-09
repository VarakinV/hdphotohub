import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { auth } from "@/lib/auth/auth";
import { generateInviteToken, sendInvitationEmail } from "@/lib/utils/invite";

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await req.json().catch(() => null) as { email?: string; realtorId?: string; role?: "ADMIN" | "REALTOR" } | null;
    if (!body?.email || !body?.realtorId) {
      return NextResponse.json({ error: "email and realtorId are required" }, { status: 400 });
    }

    const realtor = await prisma.realtor.findUnique({ where: { id: body.realtorId } });
    if (!realtor) return NextResponse.json({ error: "Realtor not found" }, { status: 404 });

    const existingUser = await prisma.user.findUnique({ where: { email: body.email } });
    if (existingUser && existingUser.realtorId === body.realtorId) {
      return NextResponse.json({ error: "User already exists for this realtor" }, { status: 409 });
    }

    const { token, tokenHash, expiresAt } = generateInviteToken(7);

    const invite = await prisma.invitation.create({
      data: {
        email: body.email,
        realtorId: realtor.id,
        role: body.role === "ADMIN" ? "ADMIN" : "REALTOR",
        tokenHash,
        expiresAt,
        invitedById: (session.user as any).id,
      },
    });

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || new URL("/", req.nextUrl).toString().replace(/\/$/, "");
    const acceptUrl = `${baseUrl}/invite/${token}`;

    await sendInvitationEmail({ email: invite.email, acceptUrl, realtorName: `${realtor.firstName} ${realtor.lastName}` });

    return NextResponse.json({ message: "Invitation created", id: invite.id, acceptUrl }, { status: 201 });
  } catch (err) {
    console.error("Create invitation error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

