import crypto from "crypto";
import { Resend } from "resend";

export function generateInviteToken(daysValid = 7): { token: string; tokenHash: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + daysValid * 24 * 60 * 60 * 1000);
  return { token, tokenHash, expiresAt };
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export type InviteEmailPayload = {
  email: string;
  acceptUrl: string;
  realtorName?: string;
};

export async function sendInvitationEmail(payload: InviteEmailPayload) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.RESEND_FROM || "Photos 4 Real Estate <onboarding@resend.dev>";

  if (!apiKey) {
    console.warn("[INVITE EMAIL] RESEND_API_KEY not set; logging invite instead.");
    console.log("[INVITE EMAIL]", payload);
    return { ok: false, skipped: true };
  }

  try {
    const resend = new Resend(apiKey);
    const subject = "You’re invited to the Photos 4 Real Estate Portal";
    const realtor = payload.realtorName ? ` for ${payload.realtorName}` : "";
    const html = `
      <div style="font-family: system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif; line-height:1.5;">
        <h2>You're invited${realtor}</h2>
        <p>You've been invited to join the Photos 4 Real Estate client portal.</p>
        <p>Click the button below to set your password and activate your account:</p>
        <p>
          <a href="${payload.acceptUrl}" style="display:inline-block;padding:10px 16px;background:#111;color:#fff;border-radius:6px;text-decoration:none">
            Accept Invitation
          </a>
        </p>
        <p>If the button doesn’t work, copy and paste this URL into your browser:</p>
        <p><a href="${payload.acceptUrl}">${payload.acceptUrl}</a></p>
        <p style="color:#666;font-size:12px">This link will expire in 7 days.</p>
      </div>`;

    const { data, error } = await resend.emails.send({
      from,
      to: payload.email,
      subject,
      html,
    });

    if (error) {
      console.error("[INVITE EMAIL] Resend error", error);
      return { ok: false, error: String(error) };
    }

    console.log("[INVITE EMAIL] sent", { to: payload.email, id: data?.id, acceptUrl: payload.acceptUrl });
    return { ok: true, id: data?.id };
  } catch (err) {
    console.error("[INVITE EMAIL] Resend send failed", err);
    return { ok: false, error: (err as Error).message };
  }
}

