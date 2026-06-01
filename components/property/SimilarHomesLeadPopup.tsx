'use client';

import { type FormEvent, useEffect, useMemo, useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getRecaptchaToken } from '@/lib/recaptcha/client';

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'form', string>>;

export default function SimilarHomesLeadPopup({
  orderId,
  listPrice,
  area,
}: {
  orderId: string;
  listPrice?: number | null;
  area?: string | null;
}) {
  const [open, setOpen] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [errors, setErrors] = useState<FormErrors>({});

  const storageKey = useMemo(() => `similar-homes-lead:${orderId}`, [orderId]);
  const formattedPrice = listPrice ? `$${listPrice.toLocaleString()}` : null;
  const areaLabel = area?.trim() || 'this area';

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const seen = window.sessionStorage.getItem(storageKey);
    if (seen) setDismissed(true);
  }, [storageKey]);

  useEffect(() => {
    if (dismissed || status === 'sent') return;
    const showPopup = () => setOpen((current) => current || true);
    const isMobile = () => window.matchMedia('(max-width: 767px)').matches;

    const onMouseOut = (event: MouseEvent) => {
      if (!isMobile() && event.clientY <= 0) showPopup();
    };

    const onScroll = () => {
      if (!isMobile()) return;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollable > 0 && window.scrollY / scrollable >= 0.5) showPopup();
    };

    document.addEventListener('mouseout', onMouseOut);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => {
      document.removeEventListener('mouseout', onMouseOut);
      window.removeEventListener('scroll', onScroll);
    };
  }, [dismissed, status]);

  function closePopup() {
    setOpen(false);
    setDismissed(true);
    window.sessionStorage.setItem(storageKey, 'dismissed');
  }

  function validate(form: HTMLFormElement) {
    const fd = new FormData(form);
    const nextErrors: FormErrors = {};
    const name = String(fd.get('name') || '').trim();
    const email = String(fd.get('email') || '').trim();
    const phone = String(fd.get('phone') || '').trim();

    if (!name) nextErrors.name = 'Please enter your name.';
    if (!email) nextErrors.email = 'Please enter your email.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (phone && phone.length > 40) nextErrors.phone = 'Phone number is too long.';

    return { values: { name, email, phone }, nextErrors };
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    setErrors({});
    const { values, nextErrors } = validate(form);
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setStatus('sending');
    try {
      const recaptchaToken = await getRecaptchaToken('property_similar_homes');
      const res = await fetch(`/api/property/${orderId}/similar-homes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...values, recaptchaToken }),
      });
      if (!res.ok) throw new Error((await res.json()).error || 'Unable to send request.');
      setStatus('sent');
      window.sessionStorage.setItem(storageKey, 'submitted');
      form.reset();
    } catch (error: any) {
      setStatus('idle');
      setErrors({ form: error?.message || 'Unable to send request.' });
    }
  }

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/45 px-4 py-6 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) {
          closePopup();
        }
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={closePopup}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900"
          aria-label="Close similar homes form"
        >
          <X className="h-4 w-4" />
        </button>

        {status === 'sent' ? (
          <div className="space-y-3 pr-6">
            <h2 className="text-2xl font-semibold text-gray-900">Thanks — we received your request.</h2>
            <p className="text-sm text-gray-600">
              We&apos;ll get back to you shortly with similar homes in {areaLabel}.
            </p>
            <Button type="button" onClick={closePopup} className="mt-2">Close</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="pr-8">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Similar Homes in This Area</p>
              <h2 className="mt-2 text-2xl font-semibold text-gray-900">
                {formattedPrice
                  ? `Want similar homes under ${formattedPrice} in ${areaLabel}?`
                  : `Want similar homes in ${areaLabel}?`}
              </h2>
              <p className="mt-2 text-sm text-gray-600">Enter your email and we&apos;ll send you options that match.</p>
            </div>

            <FieldError message={errors.form} />

            <div>
              <label htmlFor="similar-name" className="text-sm font-medium text-gray-700">Name *</label>
              <input id="similar-name" name="name" className="mt-1 w-full rounded-md border p-2" aria-invalid={!!errors.name} />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label htmlFor="similar-email" className="text-sm font-medium text-gray-700">Email *</label>
              <input id="similar-email" name="email" type="email" className="mt-1 w-full rounded-md border p-2" aria-invalid={!!errors.email} />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label htmlFor="similar-phone" className="text-sm font-medium text-gray-700">Phone <span className="font-normal text-gray-500">(optional)</span></label>
              <input id="similar-phone" name="phone" type="tel" className="mt-1 w-full rounded-md border p-2" aria-invalid={!!errors.phone} />
              <FieldError message={errors.phone} />
            </div>

            <Button type="submit" disabled={status === 'sending'} className="w-full">
              {status === 'sending' ? 'Sending…' : 'Send me info'}
            </Button>
            <p className="text-[11px] leading-relaxed text-gray-500">
              Protected by Google reCAPTCHA. We&apos;ll only use this information to respond to your home request.
            </p>
          </form>
        )}
      </div>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <p className="mt-1 text-sm text-red-600">{message}</p>;
}