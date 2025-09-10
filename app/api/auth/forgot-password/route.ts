import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import crypto from "crypto";
import { sendPasswordResetEmail } from "@/lib/utils/password-reset";

export async function POST(req: NextRequest) {
  try {
    const { email } = (await req.json().catch(() => ({}))) as { email?: string };

    // Always return success message regardless of input to avoid email enumeration
    const successResponse = NextResponse.json(
      { message: "If this email exists, we’ve sent you a reset link." },
      { status: 200 }
    );

    if (!email || typeof email !== "string") {
      return successResponse;
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      // Do not reveal user existence
      return successResponse;
    }

    // Optional: delete previous tokens for this user to keep the latest one only
    await prisma.passwordResetToken.deleteMany({ where: { userId: user.id } });

    const token = crypto.randomBytes(32).toString("hex");
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.passwordResetToken.create({
      data: {
        token,
        userId: user.id,
        expiresAt,
      },
    });

    const baseUrl =
      process.env.NEXT_PUBLIC_APP_URL || new URL("/", req.nextUrl).toString().replace(/\/$/, "");
    const resetUrl = `${baseUrl}/reset-password?token=${encodeURIComponent(token)}`;

    // Fire-and-forget; do not expose errors
    await sendPasswordResetEmail(user.email, resetUrl);

    return successResponse;
  } catch (err) {
    console.error("forgot-password error", err);
    // Still return generic success
    return NextResponse.json(
      { message: "If this email exists, we’ve sent you a reset link." },
      { status: 200 }
    );
  }
}

