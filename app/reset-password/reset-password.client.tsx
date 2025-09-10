'use client';

import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

function getPasswordErrors(pw: string): string[] {
  const errors: string[] = [];
  if (pw.length < 8) errors.push('At least 8 characters');
  if (!/[a-z]/.test(pw)) errors.push('One lowercase letter');
  if (!/[A-Z]/.test(pw)) errors.push('One uppercase letter');
  if (!/\d/.test(pw)) errors.push('One number');
  if (!/[^A-Za-z0-9]/.test(pw)) errors.push('One special character');
  return errors;
}

export function ResetPasswordClientForm({ token }: { token: string }) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const checklist = useMemo(() => {
    return [
      { label: 'At least 8 characters', ok: password.length >= 8 },
      { label: 'One lowercase letter', ok: /[a-z]/.test(password) },
      { label: 'One uppercase letter', ok: /[A-Z]/.test(password) },
      { label: 'One number', ok: /\d/.test(password) },
      { label: 'One special character', ok: /[^A-Za-z0-9]/.test(password) },
    ];
  }, [password]);

  function validateClient(): boolean {
    const pwdErrors = getPasswordErrors(password);
    setPasswordError(pwdErrors.length ? pwdErrors.join('. ') : null);

    const confErr =
      password !== confirmPassword ? 'Passwords do not match' : null;
    setConfirmError(confErr);

    return pwdErrors.length === 0 && !confErr;
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validateClient()) return;

    try {
      setLoading(true);
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password, confirmPassword }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && (data.error as string)) || 'Failed to reset password';
        setPasswordError(msg);
        throw new Error(msg);
      }
      toast.success('Password updated. You can now sign in.');
      setTimeout(() => router.push('/login'), 800);
    } catch (err) {
      // Keep toast for visibility but we also show inline errors
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <div>
        <label className="text-sm text-gray-600">New Password</label>
        <Input
          type="password"
          value={password}
          onChange={(e) => {
            const val = e.target.value;
            setPassword(val);
            const errs = getPasswordErrors(val);
            setPasswordError(errs.length ? errs.join('. ') : null);
          }}
          required
          aria-invalid={!!passwordError}
          className={
            passwordError
              ? 'border-red-500 focus-visible:ring-red-500'
              : undefined
          }
        />
        {passwordError && (
          <p className="mt-1 text-sm text-red-600" aria-live="polite">
            {passwordError}
          </p>
        )}
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
      </div>
      <div>
        <label className="text-sm text-gray-600">Confirm Password</label>
        <Input
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            const val = e.target.value;
            setConfirmPassword(val);
            setConfirmError(password !== val ? 'Passwords do not match' : null);
          }}
          required
          aria-invalid={!!confirmError}
          className={
            confirmError
              ? 'border-red-500 focus-visible:ring-red-500'
              : undefined
          }
        />
        {confirmError && (
          <p className="mt-1 text-sm text-red-600" aria-live="polite">
            {confirmError}
          </p>
        )}
      </div>
      <Button type="submit" disabled={loading}>
        {loading ? 'Saving...' : 'Set new password'}
      </Button>
    </form>
  );
}
