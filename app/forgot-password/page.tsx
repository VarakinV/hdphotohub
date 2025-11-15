'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { toast } from 'sonner';

import { getRecaptchaToken } from '@/lib/recaptcha/client';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    try {
      setLoading(true);
      const recaptchaToken = await getRecaptchaToken('forgot_password');
      const res = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email,
          recaptchaToken: recaptchaToken || undefined,
        }),
      });
      // Always display the same confirmation to prevent enumeration
      setSent(true);
      toast.success("If this email exists, we've sent you a reset link.");
    } catch (err) {
      setSent(true);
      toast.success("If this email exists, we've sent you a reset link.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Forgot Password</CardTitle>
        </CardHeader>
        <CardContent>
          {sent ? (
            <p className="text-sm text-gray-700">
              If this email exists, we&apos;ve sent you a reset link. Please
              check your inbox.
            </p>
          ) : (
            <form onSubmit={onSubmit} className="grid gap-4">
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <Input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? 'Sending...' : 'Send reset link'}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
