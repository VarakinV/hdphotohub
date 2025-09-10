import { prisma } from '@/lib/db/prisma';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Toaster } from '@/components/ui/sonner';
import { ResetPasswordClientForm } from './reset-password.client';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;

  let valid = false;
  if (token) {
    const rec = await prisma.passwordResetToken.findUnique({
      where: { token },
    });
    if (rec && rec.expiresAt > new Date()) {
      valid = true;
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Reset Password</CardTitle>
        </CardHeader>
        <CardContent>
          {!token || !valid ? (
            <p className="text-sm text-red-600">
              This reset link is invalid or has expired. Please request a new
              one.
            </p>
          ) : (
            <ResetPasswordClientForm token={token} />
          )}
        </CardContent>
      </Card>
      <Toaster />
    </div>
  );
}
