'use client';

// Lightweight Google reCAPTCHA v3 helper (no external deps)
// Usage (client only):
//   import { getRecaptchaToken } from '@/lib/recaptcha/client';
//   const token = await getRecaptchaToken('login');

declare global {
  interface Window {
    grecaptcha?: {
      ready(cb: () => void): void;
      execute(siteKey: string, opts: { action: string }): Promise<string>;
    };
  }
}

let loadPromise: Promise<void> | null = null;

function appendScript(siteKey: string): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  if (window.grecaptcha && typeof window.grecaptcha.ready === 'function') {
    return Promise.resolve();
  }
  if (loadPromise) return loadPromise;
  loadPromise = new Promise<void>((resolve, reject) => {
    try {
      const existing = document.getElementById('recaptcha-v3-script') as HTMLScriptElement | null;
      if (existing) {
        existing.addEventListener('load', () => resolve());
        existing.addEventListener('error', () => reject(new Error('reCAPTCHA script failed to load')));
        return;
      }
      const script = document.createElement('script');
      script.id = 'recaptcha-v3-script';
      script.src = `https://www.google.com/recaptcha/api.js?render=${encodeURIComponent(siteKey)}`;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => reject(new Error('reCAPTCHA script failed to load'));
      document.head.appendChild(script);
    } catch (e) {
      reject(e as any);
    }
  });
  return loadPromise;
}

async function ensureReady(siteKey: string): Promise<void> {
  await appendScript(siteKey);
  await new Promise<void>((res) => {
    if (!window.grecaptcha) return res();
    try {
      window.grecaptcha.ready(() => res());
    } catch {
      res();
    }
  });
}

export async function getRecaptchaToken(action: string): Promise<string | null> {
  const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  if (!siteKey) return null; // allow local/dev without env
  try {
    await ensureReady(siteKey);
    if (!window.grecaptcha) return null;
    const token = await window.grecaptcha.execute(siteKey, { action });
    return token || null;
  } catch {
    return null;
  }
}

