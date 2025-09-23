'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import Script from 'next/script';

declare global {
  interface Window {
    grecaptcha?: any;
  }
}

const siteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;

export default function ContactForm({
  orderId,
  toEmail,
}: {
  orderId: string;
  toEmail?: string;
}) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>(
    'idle'
  );
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('sending');
    setError(null);
    const fd = new FormData(e.currentTarget);
    let recaptchaToken: string | undefined = undefined;
    if (siteKey && typeof window !== 'undefined' && window.grecaptcha) {
      try {
        await new Promise<void>((resolve) =>
          window.grecaptcha!.ready(() => resolve())
        );
        recaptchaToken = await window.grecaptcha.execute(siteKey, {
          action: 'property_contact',
        });
      } catch {}
    }

    const body = {
      name: String(fd.get('name') || ''),
      email: String(fd.get('email') || ''),
      phone: String(fd.get('phone') || ''),
      message: String(fd.get('message') || ''),
      recaptchaToken,
    } as any;
    try {
      const res = await fetch(`/api/property/${orderId}/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (!res.ok)
        throw new Error((await res.json()).error || 'Failed to send');
      setStatus('sent');
      toast.success('Your message has been sent');
      (e.target as HTMLFormElement).reset();
    } catch (e: any) {
      setStatus('error');
      const msg = e?.message || 'Failed to send';
      setError(msg);
      toast.error(msg);
    }
  }

  return (
    <>
      <Toaster />
      {siteKey && (
        <Script
          src={`https://www.google.com/recaptcha/api.js?render=${siteKey}`}
          strategy="afterInteractive"
        />
      )}
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-600" htmlFor="name">
              Name
            </label>
            <input
              name="name"
              id="name"
              required
              className="border rounded-md w-full p-2"
            />
          </div>
          <div>
            <label className="text-xs text-gray-600" htmlFor="email">
              Email
            </label>
            <input
              type="email"
              name="email"
              id="email"
              required
              className="border rounded-md w-full p-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-600" htmlFor="phone">
              Phone
            </label>
            <input
              name="phone"
              id="phone"
              className="border rounded-md w-full p-2"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="text-xs text-gray-600" htmlFor="message">
              Message
            </label>
            <textarea
              name="message"
              id="message"
              required
              className="border rounded-md w-full p-2 min-h-28"
            />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Button type="submit" disabled={status === 'sending'}>
            {status === 'sending' ? 'Sending…' : 'Send'}
          </Button>
          {status === 'sent' && (
            <span className="text-green-600 text-sm">
              Sent! We\'ll be in touch.
            </span>
          )}
          {status === 'error' && (
            <span className="text-red-600 text-sm">{error}</span>
          )}
        </div>
        {toEmail && (
          <div className="text-xs text-gray-500">
            This message will be delivered to {toEmail}.
          </div>
        )}
      </form>
    </>
  );
}
