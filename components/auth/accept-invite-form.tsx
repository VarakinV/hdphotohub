'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';
import { signIn } from 'next-auth/react';

const schema = z.object({
  name: z.string().optional(),
  password: z
    .string()
    .min(8, 'At least 8 characters')
    .refine((v) => /[a-z]/.test(v), {
      message: 'Must include a lowercase letter',
    })
    .refine((v) => /[A-Z]/.test(v), {
      message: 'Must include an uppercase letter',
    })
    .refine((v) => /\d/.test(v), { message: 'Must include a number' })
    .refine((v) => /[^A-Za-z0-9]/.test(v), {
      message: 'Must include a special character',
    }),
});

type FormValues = z.infer<typeof schema>;

export function AcceptInviteForm({ token }: { token: string }) {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { name: '' },
  });

  const onSubmit = async (values: FormValues) => {
    setSubmitting(true);
    try {
      const res = await fetch(`/api/invitations/${token}/accept`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = data?.error || 'Failed to accept invitation';
        if (data?.details && Array.isArray(data.details))
          data.details.forEach((e: string) => toast.error(e));
        else toast.error(msg);
        return;
      }
      toast.success('Invitation accepted. Signing you in...');
      // sign in with the new credentials
      const email = data?.user?.email as string | undefined;
      const password = values.password;
      if (email) {
        const result = await signIn('credentials', {
          redirect: false,
          email,
          password,
        });
        if (result?.ok) router.replace('/portal');
        else router.replace('/login');
      } else {
        router.replace('/login');
      }
    } catch (e) {
      toast.error('Something went wrong');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[60vh] flex items-center justify-center p-4">
      <div className="w-full max-w-md border rounded-lg p-6 shadow-sm bg-white">
        <h1 className="text-xl font-semibold mb-4">Accept Invitation</h1>
        <p className="text-sm text-gray-500 mb-6">
          Set your name (optional) and password to create your account.
        </p>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2"
              {...form.register('name')}
              placeholder="Your name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              className={`mt-1 w-full border rounded px-3 py-2 ${
                form.formState.errors.password
                  ? 'border-red-500 focus-visible:ring-red-500'
                  : ''
              }`}
              type="password"
              aria-invalid={!!form.formState.errors.password}
              {...form.register('password')}
              placeholder="********"
            />
            {/* Live checklist matching /register */}
            {(() => {
              const pwd = form.watch('password') || '';
              const checklist = [
                { label: 'At least 8 characters', ok: pwd.length >= 8 },
                { label: 'One lowercase letter', ok: /[a-z]/.test(pwd) },
                { label: 'One uppercase letter', ok: /[A-Z]/.test(pwd) },
                { label: 'One number', ok: /\d/.test(pwd) },
                {
                  label: 'One special character',
                  ok: /[^A-Za-z0-9]/.test(pwd),
                },
              ];
              return (
                <ul className="mt-2 text-xs" aria-live="polite">
                  {checklist.map((c) => (
                    <li
                      key={c.label}
                      className={c.ok ? 'text-green-600' : 'text-gray-500'}
                    >
                      {c.ok ? '✓' : '•'} {c.label}
                    </li>
                  ))}
                </ul>
              );
            })()}
            {form.formState.errors.password && (
              <p className="mt-1 text-xs text-red-600">
                {form.formState.errors.password.message}
              </p>
            )}
          </div>
          <button
            disabled={submitting}
            className="w-full rounded bg-black text-white py-2 disabled:opacity-50"
          >
            {submitting ? 'Setting up...' : 'Accept & Create Account'}
          </button>
        </form>
      </div>
    </div>
  );
}
