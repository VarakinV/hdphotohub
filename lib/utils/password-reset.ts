import { Resend } from "resend";

export async function sendPasswordResetEmail(to: string, resetUrl: string) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Photos 4 Real Estate <no-reply@photos4realestate.ca>";

  if (!apiKey) {
    console.warn("[RESET EMAIL] RESEND_API_KEY not set; logging reset email instead.");
    console.log("[RESET EMAIL]", { to, resetUrl });
    return { ok: false, skipped: true } as const;
  }

  try {
    const resend = new Resend(apiKey);
    const subject = "Reset your Photos4RealEstate password";
    const html = `
      <div style="font-family: system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif; line-height:1.5; color:#111">
        <h2 style="margin:0 0 12px">Reset your password</h2>
        <p>We received a request to reset your Photos 4 Real Estate password.</p>
        <p>Click the button below to choose a new password:</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">
            Reset Password
          </a>
        </p>
        <p>If the button doesn’t work, copy and paste this URL into your browser:</p>
        <p><a href="${resetUrl}">${resetUrl}</a></p>
        <p style="color:#666;font-size:12px">This link will expire in 1 hour. If you did not request this, you can safely ignore this email.</p>
      </div>
    `;

    const { data, error } = await resend.emails.send({ from, to, subject, html });
    if (error) {
      console.error("[RESET EMAIL] Resend error", error);
      return { ok: false as const, error: String(error) };
    }
    console.log("[RESET EMAIL] sent", { to, id: data?.id, resetUrl });
    return { ok: true as const, id: data?.id };
  } catch (err) {
    console.error("[RESET EMAIL] Resend send failed", err);
    return { ok: false as const, error: (err as Error).message };
  }
}

