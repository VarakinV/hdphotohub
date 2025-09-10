import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword, validatePassword } from "@/lib/utils/password";

export async function POST(req: NextRequest) {
  try {
    let token: string | undefined;
    let password: string | undefined;
    let confirmPassword: string | undefined;

    const ct = req.headers.get("content-type") || "";
    if (ct.includes("application/json")) {
      const body = (await req.json().catch(() => ({}))) as any;
      token = body.token;
      password = body.password;
      confirmPassword = body.confirmPassword;
    } else {
      const form = await req.formData().catch(() => null);
      if (form) {
        token = String(form.get("token") || "");
        password = String(form.get("password") || "");
        confirmPassword = String(form.get("confirmPassword") || "");
      }
    }

    if (!token || !password || !confirmPassword) {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const strength = validatePassword(password);
    if (!strength.isValid) {
      return NextResponse.json({ error: strength.errors.join(". ") }, { status: 400 });
    }

    const rec = await prisma.passwordResetToken.findUnique({ where: { token } });
    if (!rec) return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    if (rec.expiresAt < new Date()) {
      await prisma.passwordResetToken.delete({ where: { id: rec.id } }).catch(() => {});
      return NextResponse.json({ error: "Invalid or expired token" }, { status: 400 });
    }

    const hashed = await hashPassword(password);

    await prisma.$transaction([
      prisma.user.update({ where: { id: rec.userId }, data: { password: hashed } }),
      prisma.passwordResetToken.delete({ where: { id: rec.id } }),
    ]);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("reset-password error", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

