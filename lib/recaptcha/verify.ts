export type RecaptchaVerifyResult = {
  ok: boolean;
  score?: number;
  action?: string;
  error?: string;
};

/** Verify a reCAPTCHA v3 token on the server. Safe no-op if RECAPTCHA_SECRET_KEY is not set. */
export async function verifyRecaptchaServer(
  token?: string | null,
  expectedAction?: string,
  minScore = Number(process.env.RECAPTCHA_MIN_SCORE || '0.3')
): Promise<RecaptchaVerifyResult> {
  try {
    const secret = process.env.RECAPTCHA_SECRET_KEY;
    if (!secret) {
      // If not configured, allow request to proceed (dev/preview)
      return { ok: true };
    }
    if (!token) return { ok: false, error: 'missing token' };

    const params = new URLSearchParams();
    params.set('secret', secret);
    params.set('response', token);

    const resp = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
      // No need to send remoteip; optional
    });

    const data = (await resp.json()) as {
      success: boolean;
      score?: number;
      action?: string;
      'error-codes'?: string[];
    };

    if (!data.success) {
      return { ok: false, error: (data['error-codes'] || []).join(',') || 'verify failed' };
    }
    const score = typeof data.score === 'number' ? data.score : undefined;
    const action = data.action;

    if (score !== undefined && score < minScore) {
      return { ok: false, score, action, error: 'low score' };
    }
    if (expectedAction && action && action !== expectedAction) {
      // Action mismatch; treat as failure
      return { ok: false, score, action, error: 'action mismatch' };
    }

    return { ok: true, score, action };
  } catch (e: any) {
    return { ok: false, error: e?.message || 'verify error' };
  }
}

