'use client';

import { type FormEvent, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { MortgageCalculatorInputs } from '@/lib/mortgage';
import { getRecaptchaToken } from '@/lib/recaptcha/client';

type FormErrors = Partial<Record<'name' | 'email' | 'phone' | 'form', string>>;

export default function MortgageLeadModal({
  open,
  orderId,
  inputs,
  disabled,
  onClose,
}: {
  open: boolean;
  orderId: string;
  inputs: MortgageCalculatorInputs;
  disabled?: boolean;
  onClose: () => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent'>('idle');
  const [errors, setErrors] = useState<FormErrors>({});

  useEffect(() => {
    if (open) return;
    setName('');
    setEmail('');
    setPhone('');
    setStatus('idle');
    setErrors({});
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [onClose, open]);

  function validate() {
    const nextErrors: FormErrors = {};
    if (!name.trim()) nextErrors.name = 'Name is required.';
    if (!email.trim()) nextErrors.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      nextErrors.email = 'Please enter a valid email address.';
    }
    if (phone.trim().length > 40) nextErrors.phone = 'Phone number is too long.';
    return nextErrors;
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextErrors = validate();
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length || disabled) return;

    setStatus('sending');
    try {
      const recaptchaToken = await getRecaptchaToken('property_mortgage_calculator');
      const res = await fetch(`/api/property/${orderId}/mortgage-calculator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...inputs,
          name: name.trim(),
          email: email.trim(),
          phone: phone.trim(),
          recaptchaToken,
        }),
      });

      if (!res.ok) {
        throw new Error((await res.json()).error || 'Unable to send your calculation.');
      }

      setStatus('sent');
    } catch (error: any) {
      setStatus('idle');
      setErrors({ form: error?.message || 'Unable to send your calculation.' });
    }
  }

  if (!open || typeof document === 'undefined') return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[1000] flex items-end justify-center bg-black/50 px-4 py-6 sm:items-center"
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 text-gray-900 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
          aria-label="Close mortgage lead form"
        >
          <X className="h-4 w-4" />
        </button>

        {status === 'sent' ? (
          <div className="space-y-3 pr-6">
            <h2 className="text-2xl font-semibold">Thank you!</h2>
            <p className="text-sm font-medium text-gray-700">Your mortgage estimate is on the way.</p>
            <p className="text-sm text-gray-600">
              We sent your calculation to the email address you provided and shared it with the realtor as well.
            </p>
            <Button type="button" onClick={onClose}>Close</Button>
          </div>
        ) : (
          <form onSubmit={onSubmit} className="space-y-4" noValidate>
            <div className="pr-8">
              <p className="text-sm font-medium uppercase tracking-wide text-gray-500">Send me this</p>
              <h2 className="mt-2 text-2xl font-semibold">Get this mortgage estimate by email</h2>
              <p className="mt-2 text-sm text-gray-600">
                We&apos;ll email the full breakdown to you and notify the realtor so they can follow up if you&apos;d like.
              </p>
            </div>

            <FieldError message={errors.form} />

            <div>
              <label htmlFor="mortgage-name" className="text-sm font-medium text-gray-700">Name *</label>
              <input
                id="mortgage-name"
                value={name}
                onChange={(event) => {
                  setName(event.target.value);
                  setErrors((current) => ({ ...current, name: undefined, form: undefined }));
                }}
                className="mt-1 w-full rounded-md border p-2"
                aria-invalid={!!errors.name}
              />
              <FieldError message={errors.name} />
            </div>
            <div>
              <label htmlFor="mortgage-email" className="text-sm font-medium text-gray-700">Email *</label>
              <input
                id="mortgage-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setErrors((current) => ({ ...current, email: undefined, form: undefined }));
                }}
                className="mt-1 w-full rounded-md border p-2"
                aria-invalid={!!errors.email}
              />
              <FieldError message={errors.email} />
            </div>
            <div>
              <label htmlFor="mortgage-phone" className="text-sm font-medium text-gray-700">
                Phone <span className="font-normal text-gray-500">(optional)</span>
              </label>
              <input
                id="mortgage-phone"
                type="tel"
                value={phone}
                onChange={(event) => {
                  setPhone(event.target.value);
                  setErrors((current) => ({ ...current, phone: undefined, form: undefined }));
                }}
                className="mt-1 w-full rounded-md border p-2"
                aria-invalid={!!errors.phone}
              />
              <FieldError message={errors.phone} />
            </div>

            <Button type="submit" disabled={status === 'sending' || disabled} className="w-full">
              {status === 'sending' ? 'Sending…' : 'Send'}
            </Button>
            <p className="text-[11px] leading-relaxed text-gray-500">
              Protected by Google reCAPTCHA. We&apos;ll only use this information to send your estimate and follow up on your request.
            </p>
          </form>
        )}
      </div>
    </div>,
    document.body
  );
}

function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-sm text-red-600">{message}</p> : null;
}