'use client';
import { Suspense, useEffect, useMemo } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

function InterstitialClient() {
  const params = useSearchParams();
  const router = useRouter();

  const nextUrl = useMemo(() => {
    const n = params.get('next');
    if (!n) return null;
    try {
      // Ensure we only redirect to the same origin for safety
      const u = new URL(n, window.location.origin);
      const sameOrigin = u.origin === window.location.origin;
      if (!sameOrigin) return null;
      // Only allow NextAuth email callback path
      if (!u.pathname.startsWith('/api/auth/callback/email')) return null;
      return u.toString();
    } catch {
      return null;
    }
  }, [params]);

  useEffect(() => {
    if (!nextUrl) return;
    // Use replace to avoid keeping this intermediate page in history
    window.location.replace(nextUrl);
  }, [nextUrl]);

  if (!nextUrl) {
    return (
      <div className="mx-auto max-w-md p-6">
        <h1 className="text-xl font-semibold mb-2">Invalid or expired link</h1>
        <p className="text-sm text-gray-600">
          Please request a new magic link and try again.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md p-6">
      <h1 className="text-xl font-semibold mb-2">Signing you in…</h1>
      <p className="text-sm text-gray-600">
        If you are not redirected automatically, click Continue.
      </p>
      <div className="mt-4">
        <button
          onClick={() => router.replace(nextUrl)}
          className="inline-flex items-center justify-center rounded-md bg-gray-900 px-4 py-2 text-white hover:bg-gray-800"
        >
          Continue
        </button>
      </div>
    </div>
  );
}

export default function EmailVerifyRedirect() {
  return (
    <Suspense fallback={<div className="mx-auto max-w-md p-6">Loading…</div>}>
      <InterstitialClient />
    </Suspense>
  );
}
