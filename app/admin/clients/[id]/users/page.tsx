import { prisma } from '@/lib/db/prisma';
import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { headers, cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';
import { ChevronLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { InviteUserForm } from '@/components/admin/invite-user-form';

export default async function RealtorUsersPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  const user = session?.user as any;
  if (!user || user.role !== 'ADMIN') redirect('/login');

  const { id } = await params;
  const realtor = await prisma.realtor.findUnique({
    where: { id },
    include: { users: true },
  });
  if (!realtor) redirect('/admin/clients');

  const invites = await prisma.invitation.findMany({
    where: { realtorId: id, acceptedAt: null },
  });

  const action = async (formData: FormData) => {
    'use server';
    const email = String(formData.get('email') || '').trim();
    const role = String(formData.get('role') || 'REALTOR').toUpperCase() as
      | 'REALTOR'
      | 'ADMIN';
    if (!email) return;
    const hdrs = await headers();
    const proto = hdrs.get('x-forwarded-proto') ?? 'http';
    const host = hdrs.get('host');
    const base =
      process.env.NEXT_PUBLIC_APP_URL ||
      (host ? `${proto}://${host}` : 'http://localhost:3000');

    const cookieStore = await cookies();
    const cookieHeader = cookieStore
      .getAll()
      .map((c) => `${c.name}=${c.value}`)
      .join('; ');

    const res = await fetch(`${base}/api/invitations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookieHeader },
      credentials: 'include',
      cache: 'no-store',
      body: JSON.stringify({ email, realtorId: id, role }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.error || 'Failed to create invitation');
    }

    revalidatePath(`/admin/clients/${id}/users`);
  };

  return (
    <div className="w-full">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <Link
            href="/admin/clients"
            className="mb-2 inline-flex items-center gap-1 text-[13px] font-semibold text-muted-foreground hover:text-brick-600"
          >
            <ChevronLeft className="h-4 w-4" /> All clients
          </Link>
          <h2 className="font-display text-[22px] font-semibold leading-tight">
            {realtor.firstName} {realtor.lastName} · Users
          </h2>
          <p className="mt-0.5 text-[13.5px] text-muted-foreground">
            Manage users attached to this realtor account
          </p>
        </div>
        <div className="flex w-full flex-wrap gap-2 sm:w-auto">
          <Button variant="outline" size="sm" asChild>
            <Link href="/admin/clients">Back to Clients</Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        <InviteUserForm action={action} />

        <div className="grid gap-4 md:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-4.5">
            <h3 className="font-display mb-3 text-[15px] font-semibold">Pending invitations</h3>
            {invites.length === 0 ? (
              <p className="text-sm text-muted-foreground">No pending invitations.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {invites.map((inv) => (
                  <li
                    key={inv.id}
                    className="flex items-center justify-between border-b border-border pb-2 last:border-b-0 last:pb-0"
                  >
                    <div>
                      <div>{inv.email}</div>
                      <div className="text-xs text-faint">
                        Expires {new Date(inv.expiresAt).toLocaleString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <div className="rounded-2xl border border-border bg-card p-4.5">
            <h3 className="font-display mb-3 text-[15px] font-semibold">Active users</h3>
            {realtor.users.length === 0 ? (
              <p className="text-sm text-muted-foreground">No users yet.</p>
            ) : (
              <ul className="space-y-2 text-sm">
                {realtor.users.map((u) => (
                  <li key={u.id} className="border-b border-border pb-2 last:border-b-0 last:pb-0">
                    {u.email}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
